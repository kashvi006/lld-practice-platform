import { describe, it, expect } from 'vitest';
import { Submission, TextSubmissionContent } from '../../src/domain/Submission.js';
import { ValidationError } from '../../src/domain/errors/index.js';

const validContent: TextSubmissionContent = {
  assumptions: 'Assume a 4-floor commercial lot with 100 spots per floor, standard operating hours.',
  requirementsInterpretation: 'The system must support motorcycles, cars, and trucks with dynamic spot allocation.',
  classes: 'ParkingLot, Floor, ParkingSpot, CompactSpot, LargeSpot, Ticket, Vehicle, Car, Bike.',
  responsibilities: 'ParkingLot coordinates floors. ParkingSpot tracks occupancy. FeeService computes dues.',
  relationships: 'ParkingLot has many Floors. Floor has many ParkingSpots. Ticket references ParkingSpot.',
  interfacesAbstractions: 'IPricingStrategy for hourly/daily rates, ISpotAllocationStrategy for nearest spot.',
  designPatterns: 'Strategy pattern for pricing and spot allocation algorithms. Factory for vehicles.',
  mainApproach: 'When a vehicle enters, allocate nearest compatible spot, issue ticket, mark spot occupied.',
  edgeCases: 'Handle full lot, concurrent entry race conditions with locks, lost ticket recovery.',
  tradeOffs: 'In-memory spot lookup chosen for speed over persistent DB queries for every check.',
  extensibility: 'New vehicle types can be introduced by subclassing Vehicle and creating matching Spot types.'
};

describe('Submission Domain Entity', () => {
  it('should validate and create a valid TextSubmission', () => {
    const submission = new Submission({
      id: 'sub-1',
      attemptId: 'att-1',
      submissionType: 'TEXT',
      content: validContent
    });

    expect(submission.id).toBe('sub-1');
    expect(submission.submissionType).toBe('TEXT');
    expect(submission.getTextContent().classes).toContain('ParkingLot');
  });

  it('should throw ValidationError if any required section is missing or empty', () => {
    const incomplete = { ...validContent, assumptions: '' };

    expect(() => {
      new Submission({
        id: 'sub-2',
        attemptId: 'att-1',
        submissionType: 'TEXT',
        content: incomplete
      });
    }).toThrow(ValidationError);
  });

  it('should throw ValidationError if a section has less than the minimum required characters', () => {
    const tooShort = { ...validContent, edgeCases: 'too short' };

    try {
      new Submission({
        id: 'sub-3',
        attemptId: 'att-1',
        submissionType: 'TEXT',
        content: tooShort
      });
      expect.fail('Should have thrown ValidationError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('edgeCases');
    }
  });

  it('should accommodate Diagram and Code submission payloads without breaking domain model (Change Test A)', () => {
    const diagramSub = new Submission({
      id: 'sub-diag-1',
      attemptId: 'att-2',
      submissionType: 'DIAGRAM',
      content: {
        diagramFormat: 'MERMAID',
        diagramData: 'classDiagram class ParkingLot',
        explanation: 'Mermaid class diagram of parking lot'
      }
    });

    expect(diagramSub.submissionType).toBe('DIAGRAM');
  });
});