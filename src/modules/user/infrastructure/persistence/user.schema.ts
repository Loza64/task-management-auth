import { model, PaginateModel, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { TaskDocument } from '../../../task/infrastructure/persistence/task.schema';

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  username: string;
  password?: string;
  tasks: (Types.ObjectId | TaskDocument)[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true, select: false },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  },
  { timestamps: true, versionKey: false },
);

userSchema.plugin(mongoosePaginate);

export const UserModel = model<UserDocument, PaginateModel<UserDocument>>('User', userSchema);
