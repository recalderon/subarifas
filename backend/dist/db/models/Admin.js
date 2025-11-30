import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
const AdminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
// Method to compare passwords
AdminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};
// Static method to hash password
AdminSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 10);
};
export const Admin = mongoose.model('Admin', AdminSchema);
//# sourceMappingURL=Admin.js.map