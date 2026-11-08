import mongoose from 'mongoose';
import { MESSAGE_TYPES, DELIVERY_STATUSES, EMAIL_REGEX } from '../../config/constants.js';

const { Schema } = mongoose;

// Outbound messages (acknowledgements and staff-approved replies). Delivery is mocked in this assignment.
const messageSchema = new Schema(
  {
    enquiryId: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true },
    type: { type: String, enum: MESSAGE_TYPES, required: true },
    channel: { type: String, enum: ['email'], default: 'email' },
    to: { type: String, required: true, trim: true, lowercase: true, match: [EMAIL_REGEX, 'Recipient email is not valid'] },
    subject: { type: String, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    deliveryStatus: { type: String, enum: DELIVERY_STATUSES, default: 'mocked' },
    aiAssisted: { type: Boolean, default: false },
    // Replies require a human approver; acknowledgements are system-generated templates.
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [
        function approverRequired() {
          return this.type === 'reply';
        },
        'A reply must be approved by a staff member',
      ],
    },
    approvedAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ enquiryId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
