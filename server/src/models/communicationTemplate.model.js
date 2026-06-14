import mongoose from 'mongoose'

const communicationTemplateSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
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
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

export const CommunicationTemplate = mongoose.models.CommunicationTemplate || mongoose.model('CommunicationTemplate', communicationTemplateSchema)
