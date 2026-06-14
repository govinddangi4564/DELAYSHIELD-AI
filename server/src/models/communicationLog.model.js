import mongoose from 'mongoose'

const communicationLogSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      index: true
    },
    stakeholderType: {
      type: String,
      enum: ['Driver', 'Warehouse', 'Customer'],
      required: true
    },
    eventType: {
      type: String,
      enum: ['Delay Risk', 'Route Change', 'Warehouse Change', 'Updated ETA'],
      required: true
    },
    recipient: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Delivered', 'Pending', 'Failed'],
      default: 'Pending'
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

export const CommunicationLog = mongoose.models.CommunicationLog || mongoose.model('CommunicationLog', communicationLogSchema)
