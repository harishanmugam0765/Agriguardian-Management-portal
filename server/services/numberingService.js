/**
 * AgriGuardian Atomic Numbering Engine
 * Enforces unique serial codes across schools, farmers, invoices, and HR.
 * Prevents race conditions using atomic MongoDB counters.
 */
const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
  seqKey: { type: String, required: true },
  year: { type: Number, required: true },
  currentSeq: { type: Number, default: 0 }
});
SequenceSchema.index({ seqKey: 1, year: 1 }, { unique: true });

const Sequence = mongoose.models.Sequence || mongoose.model('Sequence', SequenceSchema);

async function getNextSequence(seqKey, year = new Date().getFullYear()) {
  const result = await Sequence.findOneAndUpdate(
    { seqKey, year },
    { $inc: { currentSeq: 1 } },
    { new: true, upsert: true }
  );
  return result.currentSeq;
}

async function generateCode(type, category = null) {
  const year = new Date().getFullYear();

  switch (type) {
    case 'EMPLOYEE': {
      const seq = await getNextSequence('EMP', year);
      return `AG-EMP-${year}-${String(seq).padStart(4, '0')}`;
    }
    case 'INTERN': {
      const seq = await getNextSequence('INT', year);
      return `AG-INT-${year}-${String(seq).padStart(4, '0')}`;
    }
    case 'CUSTOMER': {
      const seq = await getNextSequence('CUS', year);
      return `AG-CUS-${year}-${String(seq).padStart(4, '0')}`;
    }
    case 'VENDOR': {
      const seq = await getNextSequence('VEN', year);
      return `AG-VEN-${year}-${String(seq).padStart(4, '0')}`;
    }
    case 'QUOTATION': {
      if (category === 'School') {
        // Format: QTN-YYYY-SCHNN (2-digit sequence with annual reset)
        const seq = await getNextSequence('QTN_SCH', year);
        return `QTN-${year}-SCH${String(seq).padStart(2, '0')}`;
      } else {
        // Format: AG-QUO-YYYY-NNNN (4-digit sequence)
        const seq = await getNextSequence('QUO_FAR', year);
        return `AG-QUO-${year}-${String(seq).padStart(4, '0')}`;
      }
    }
    case 'INVOICE': {
      // Unified sequence: AG-INV-YYYY-NNNN
      const seq = await getNextSequence('INV', year);
      return `AG-INV-${year}-${String(seq).padStart(4, '0')}`;
    }
    case 'RECEIPT': {
      const seq = await getNextSequence('RCP', year);
      return `AG-RCP-${year}-${String(seq).padStart(4, '0')}`;
    }
    default:
      throw new Error(`Unsupported document type for numbering engine: ${type}`);
  }
}

module.exports = {
  getNextSequence,
  generateCode
};
