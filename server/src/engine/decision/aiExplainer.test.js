import { expect } from 'chai';
import { explainDecision } from './aiExplainer.js';

describe('AI Explainer Engine', () => {
  it('should explain a High Risk scenario', () => {
    const input = {
      risk: {
        score: 85,
        level: "High",
        breakdown: { traffic: 45, warehouse: 30 }
      },
      recoveryPlan: { primaryCause: "Traffic Congestion" },
      shipmentId: "SHP-123"
    };

    const result = explainDecision(input);
    expect(result).to.have.property('explanation');
    expect(result.explanation).to.include('SLA Risk score is critically high at 85/100');
    expect(result.explanation).to.include('Warehouse utilization metrics');
    expect(result.explanation).to.include('Traffic congestion on the current route');
    expect(result.keyFactors).to.include('Traffic Congestion');
    expect(result.keyFactors).to.include('Warehouse Load');
    expect(result.summary).to.include('High probability of SLA breach');
  });

  it('should explain a Moderate scenario', () => {
    const input = {
      risk: {
        score: 55,
        level: "Medium",
        breakdown: { weather: 35, warehouse: 25 }
      },
      recoveryPlan: { primaryCause: "Weather Conditions" },
      shipmentId: "SHP-456"
    };

    const result = explainDecision(input);
    expect(result.keyFactors).to.include('Weather Conditions');
    expect(result.keyFactors).to.include('Warehouse Load');
    expect(result.explanation).to.include('SLA Risk score is elevated');
    expect(result.summary).to.include('Moderate SLA risk detected');
  });

  it('should explain a Low Risk scenario', () => {
    const input = {
      risk: {
        score: 20,
        level: "Low",
        breakdown: { traffic: 5 }
      },
      shipmentId: "SHP-789"
    };

    const result = explainDecision(input);
    expect(result.explanation).to.include('All operational parameters are within safe margins');
    expect(result.summary).to.equal('SLA compliance is currently on track.');
  });
});
