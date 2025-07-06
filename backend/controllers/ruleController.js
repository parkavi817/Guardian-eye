const Rule = require('../models/Rule');
const { loadActiveRules } = require('../services/ruleEngine'); // Import loadActiveRules

exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.find();
    const formattedRules = rules.map(rule => ({
      id: rule._id.toString(),
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      action: rule.action,
      category: rule.category,
      severityImpact: rule.severityImpact,
      isEnabled: rule.enabled, // <-- Changed from rule.isEnabled to rule.enabled
    }));
    res.json(formattedRules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRule = async (req, res) => {
  try {
    const rule = await Rule.create(req.body);
    const formattedRule = {
      id: rule._id.toString(),
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      action: rule.action,
      category: rule.category,
      severityImpact: rule.severityImpact,
      isEnabled: rule.enabled, // <-- Changed from rule.isEnabled to rule.enabled
    };
    // After creating a rule, reload active rules in the engine
    loadActiveRules();
    res.status(201).json(formattedRule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: Update Rule function
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    // Destructure fields that can be updated. Ensure 'enabled' is mapped to 'isEnabled' if frontend sends it that way.
    const { name, description, condition, action, category, severityImpact, isEnabled } = req.body;

    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    rule.name = name || rule.name;
    rule.description = description || rule.description;
    rule.condition = condition || rule.condition;
    rule.action = action || rule.action;
    rule.category = category || rule.category;
    rule.severityImpact = severityImpact || rule.severityImpact;
    rule.enabled = typeof isEnabled === 'boolean' ? isEnabled : rule.enabled; // Handle boolean for enabled

    await rule.save();

    const formattedRule = {
      id: rule._id.toString(),
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      action: rule.action,
      category: rule.category,
      severityImpact: rule.severityImpact,
      isEnabled: rule.enabled,
    };
    // After updating a rule, reload active rules in the engine
    loadActiveRules();
    res.json(formattedRule);
  } catch (err) {
    console.error('Error updating rule:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.toggleRule = async (req, res) => {
  try {
    const { isEnabled } = req.body; // Frontend sends 'isEnabled'
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    rule.enabled = isEnabled; // <-- Changed from rule.isEnabled to rule.enabled
    await rule.save();
    const formattedRule = {
      id: rule._id.toString(),
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      action: rule.action,
      category: rule.category,
      severityImpact: rule.severityImpact,
      isEnabled: rule.enabled, // <-- Changed from rule.isEnabled to rule.enabled
    };
    // After toggling a rule, reload active rules in the engine
    loadActiveRules();
    res.json(formattedRule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    // After deleting a rule, reload active rules in the engine
    loadActiveRules();
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};