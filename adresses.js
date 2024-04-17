import mongoose from 'mongoose'

const Schema = mongoose.Schema
const AddressSchema = new Schema({
	chat_id: {
		type: String,
		required: true,
	},
	real_address: {
		type: String,
		required: true,
		unique: true,
	},
	personal_account: {
		type: String,
		required: true,
		unique: true,
	},
	electricity_meter_type: {
		type: String,
		enum: ['1', '2', '3'],
		required: true,
	},
})

export default AddressSchema
