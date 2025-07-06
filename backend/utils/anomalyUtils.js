const axios = require('axios');

exports.evaluateTrustScore = async ({ typingSpeed, pasteDetected, checkoutDuration, countryMismatch }) => {
  try {
    const featuresToSend = [[ // Wrapped in an outer array
        typingSpeed,
        pasteDetected ? 1 : 0,
        checkoutDuration,
        countryMismatch ? 1 : 0,
        0, // Placeholder for feature 5
        0, // Placeholder for feature 6
        0, // Placeholder for feature 7
        0, // Placeholder for feature 8
        0, // Placeholder for feature 9
        0  // Placeholder for feature 10
      ]];
    console.log('Sending features to Python API:', featuresToSend); // Added console.log
    const response = await axios.post(`${process.env.PYTHON_API}/predict`, {
      features: featuresToSend
    });

    return response.data; // { prediction, trust_score }
  } catch (error) {
    console.error('❌ Error evaluating trust score:', error.message);
    return { prediction: 1, trust_score: 0 }; // suspicious default
  }
};