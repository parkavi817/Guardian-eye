const { Parser } = require('expr-eval');
const Rule = require('../models/Rule');
const Alert = require('../models/Alert');
const User = require('../models/User');

let activeRules = [];
const parser = new Parser();

const preprocessCondition = (conditionString) => {
  return conditionString
    .replace(/&&/g, 'and')
    .replace(/\|\|/g, 'or')
    .replace(/!/g, 'not ')
    .replace(/AND/g, 'and') // Add this
    .replace(/OR/g, 'or')   // Add this
    // These will prevent parse errors but won't make the functions work
    .replace(/count\(([^)]+)\)\s*within\s*(\d+\s*(?:hour|minute|second)s?)/g, 'false /* complex_time_window_rule */')
    .replace(/count\(([^)]+)\)/g, 'false /* complex_count_rule */');
};

const loadActiveRules = async () => {
  try {
    activeRules = await Rule.find({ enabled: true });
    console.log(`[RuleEngine] Loaded ${activeRules.length} active rules.`);
  } catch (error) {
    console.error('[RuleEngine] Error loading active rules:', error);
  }
};

loadActiveRules();
setInterval(loadActiveRules, 5 * 60 * 1000);

const evaluateCondition = (conditionString, context) => {
  let processedCondition = conditionString;
  try {
    processedCondition = preprocessCondition(conditionString);
    return parser.evaluate(processedCondition, context);
  } catch (error) {
    console.error(`[RuleEngine] Error evaluating condition "${conditionString}" (processed as "${processedCondition}"):`, error.message);
    return false;
  }
};

const executeAction = async (actionString, context) => {
  try {
    if (actionString.includes('create_alert')) {
      const userId = context.user ? context.user._id : null;
      const userEmail = context.user ? context.user.email : 'N/A';
      const message = actionString.replace('create_alert(', '').replace(')', '').trim();
      const severity = context.rule ? context.rule.severityImpact >= 70 ? 'High' : context.rule.severityImpact >= 40 ? 'Medium' : 'Low' : 'Medium';

      if (userId) {
        await Alert.create({
          userId: userId,
          userEmail: userEmail,
          message: message,
          severity: severity,
          reason: context.rule ? context.rule.name : 'Rule Triggered',
          source: 'Rule Engine',
        });
        console.log(`[RuleEngine] Alert created for user ${userEmail}: ${message}`);
      } else {
        console.warn(`[RuleEngine] Could not create alert: User ID missing for action "${actionString}"`);
      }
    } else if (actionString.includes('update_trust_score')) {
      const userId = context.user ? context.user._id : null;
      const scoreChange = parseFloat(actionString.replace('update_trust_score(', '').replace(')', '').trim());
      if (userId && !isNaN(scoreChange)) {
        const user = await User.findById(userId);
        if (user) {
          user.trustScore = Math.max(0, Math.min(1, user.trustScore + scoreChange));
          await user.save();
          console.log(`[RuleEngine] User ${user.email} trust score updated to ${user.trustScore}`);
        }
      }
    }
  } catch (error) {
    console.error(`[RuleEngine] Error executing action "${actionString}":`, error.message);
  }
};

// Main function to evaluate rules for a given context and event type
exports.evaluateRules = async (context, eventType = 'all') => { // ADDED eventType parameter
  const rulesToEvaluate = activeRules.filter(rule =>
    rule.eventType === 'all' || rule.eventType === eventType
  );

  for (const rule of rulesToEvaluate) { // Changed from activeRules to rulesToEvaluate
    const ruleContext = { ...context, rule: { ...rule.toObject(), id: rule._id.toString() } };
    if (evaluateCondition(rule.condition, ruleContext)) {
      console.log(`[RuleEngine] Rule "${rule.name}" triggered for event type "${eventType}"!`);
      await executeAction(rule.action, ruleContext);
    }
  }
};

exports.loadActiveRules = loadActiveRules;