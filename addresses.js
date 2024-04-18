import mongoose from 'mongoose'

const Schema = mongoose.Schema

const IndicationSchema = new Schema({
	date: { type: Date, default: Date.now },
	day: { type: Number, required: false },
	night: { type: Number, required: false },
	peak: { type: Number, required: false },
})

const AddressSchema = new Schema({
	chat_id: {
		type: String,
		required: true,
	},
	real_address: {
		type: String,
		unique: true,
		required: true,
	},
	nomber_facture_p: {
		type: String,
		unique: true,
		required: true,
	},
	type_counter: {
		type: String,
		enum: ['1', '2', '3'],
		required: true,
	},
	rem: {
		type: String,
		required: true,
	},
	phonenumber_p: {
		type: String,
		required: true,
	},
	indications: [IndicationSchema],
})

export default AddressSchema
