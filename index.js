import 'dotenv/config'
import mongoose from 'mongoose'
import { Bot, InlineKeyboard, Keyboard } from 'grammy'
import AddressSchema from './adresses.js'

const Address = mongoose.model('Address', AddressSchema)

mongoose.set('strictQuery', false)
const connectDb = async () => {
	try {
		const c = await mongoose.connect(process.env.MONGO_URI)
		console.log(c.connection.host)
	} catch (err) {
		console.log(err)
		process.exit(1)
	}
}

const addresses = [
	'Address 1',
	'Address 2',
	'Address 3',
	'Address 4',
	'Address 5',
	'Address 6',
]
const addresses1 = [
	{ address: 'Random', personalAccount: 4343443342, electricityMeterType: 1 },
	{
		address: 'Random123',
		personalAccount: '777453443342',
		electricityMeterType: '3',
	},
]

const bot = new Bot(process.env.TG_TOKEN)

// bot.api.setMyCommands([
// 	{
// 		command: 'add_adresses',
// 		description: 'Додати нову адресу',
// 	},
// 	{
// 		command: 'get_adresses',
// 		description: 'Отримати свої адреси',
// 	},
// ])

bot.command('add_adresses', async ctx => {
	try {
		await Address.create({
			chat_id: '23',
			real_address: '23',
			personal_account: '23',
			electricity_meter_type: '2',
		})
		await ctx.reply('Address added successfully.')
	} catch (err) {
		console.error('Error adding address:', err)
		await ctx.reply('Failed to add address.')
	}
})

bot.command('get_adresses', async ctx => {
	const inlineKeyboard = new InlineKeyboard()
	addresses1.forEach((a, i) => {
		inlineKeyboard.text(a.address, a.personalAccount)
	})

	await ctx.reply('Оберіть адресу для передачі показань', {
		reply_markup: inlineKeyboard,
	})
})

bot.on('callback_query:data', async ctx => {
	console.log(ctx)
	await ctx.reply('wewe')
})

bot.hears(
	addresses1.map(a => a.address),
	async ctx => {
		console.log(ctx.message.text)
		await ctx.reply('Вкажіть ваші показння', {
			reply_markup: { remove_keyboard: true },
		})
	}
)

connectDb()
bot.start()
