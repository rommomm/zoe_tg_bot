import 'dotenv/config'
import mongoose from 'mongoose'
import { Bot, GrammyError, InlineKeyboard, session } from 'grammy'
import AddressSchema from './addresses.js'
import { countType, remType, sendDataToServer } from './config.js'

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

const bot = new Bot(process.env.TG_TOKEN)

bot.use(
	session({
		initial: () => ({
			chat_id: '',
			real_address: '',
			nomber_facture_p: '',
			type_counter: '',
			rem: '',
			phonenumber_p: '',
			pokazaniya_p: '',
			pokazaniya_p2: '',
			pokazaniya_p3: '',
		}),
	})
)
bot.api.setMyCommands([
	{
		command: 'add_address',
		description: 'Додати нову адресу',
	},
	{
		command: 'get_addresses',
		description: 'Отримати свої адреси',
	},
])

bot.command('add_address', async ctx => {
	try {
		ctx.session = {}
		ctx.session.chat_id = ctx.msg.chat.id
		let counter = 1
		const inlineKeyboard = new InlineKeyboard()
		Object.keys(remType).forEach(key => {
			inlineKeyboard.text(`${counter}. ${remType[key]}`, `select_rem|${key}`)
			inlineKeyboard.row()
			counter++
		})
		await ctx.reply('🌆 Вкажіть підрозділ:', {
			reply_markup: inlineKeyboard,
			parse_mode: 'HTML',
		})

		ctx.session.currentStep = 1
	} catch (err) {
		console.error('Error handling add_address command:', err.message)
		await ctx.reply('Failed to initiate address addition.')
	}
})

bot.command('get_addresses', async ctx => {
	try {
		console.log(ctx.msg.chat.id)
		const addresses = await Address.where({
			chat_id: ctx.msg.chat.id,
		})
		if (addresses && !addresses.length) {
			return await ctx.reply(
				'<b>🏠 У вас немає адрес, додати /add_address</b>',
				{ parse_mode: 'HTML' }
			)
		}

		const inlineKeyboard = new InlineKeyboard()
		addresses.forEach((a, i) => {
			inlineKeyboard.text(
				`🏠 ${a.real_address}`,
				`${a.chat_id}|${a.real_address}|${a.nomber_facture_p}|${a.type_counter}|${a.rem}|${a.phonenumber_p}`
			)
			inlineKeyboard.row()
		})
		await ctx.reply('<b>➕ Оберіть адресу для передачі показань:</b>', {
			reply_markup: inlineKeyboard,
			parse_mode: 'HTML',
		})
	} catch (err) {
		console.error('Error adding address:', err.message)
		await ctx.reply('Failed to add address.')
	}
})

bot.on('message', async ctx => {
	try {
		if (!ctx.session.chat_id) {
			return await ctx.reply(
				'<b>🏠 Будь ласка вкажіть необхідну адресу /get_addresses для передачі показань</b>',
				{ parse_mode: 'HTML' }
			)
		}

		const messageText = ctx.message.text.trim().toLowerCase()
		const type_counter = ctx.session.type_counter
		console.log(messageText)
		if (ctx.session.currentStep) {
			switch (ctx.session.currentStep) {
				case 1:
					ctx.session.rem = messageText
					await ctx.reply('🏠 Вкажіть адресу:')
					ctx.session.currentStep = 2
					break
				case 2:
					ctx.session.real_address = messageText
					await ctx.reply('💼 Вкажіть номер особового рахунку:')
					ctx.session.currentStep = 3
					break
				case 3:
					ctx.session.nomber_facture_p = messageText

					const inlineKeyboard = new InlineKeyboard()
					Object.keys(countType).forEach(key => {
						inlineKeyboard.text(`${countType[key]}`, `select_countType|${key}`)
						inlineKeyboard.row()
					})
					await ctx.reply('💡 Вкажіть тип лічильника:', {
						reply_markup: inlineKeyboard,
					})
					ctx.session.currentStep = 4
					break
				case 4:
					ctx.session.type_counter = messageText
					await ctx.reply('📱 Вкажіть номер телефону:')
					ctx.session.currentStep = 5
					break
				case 5:
					ctx.session.phonenumber_p = messageText

					const keyboardMarkup = new InlineKeyboard()
						.text('Додати', 'save_address')
						.text('Відмінити', 'get_addresses')
					const formattedMessage = `
					🌆 <b>Підрозділ:</b> ${remType[ctx.session.rem]}
🏠 <b>Адреса:</b> ${ctx.session.real_address}
💼 <b>Номер особового рахунку:</b> ${ctx.session.nomber_facture_p}
📱 <b>Номер телефону:</b> ${ctx.session.phonenumber_p}
💡 <b>Тип лічильника:</b> ${countType[ctx.session.type_counter]}`
					return await ctx.reply(formattedMessage, {
						reply_markup: keyboardMarkup,
						parse_mode: 'HTML',
					})
					break
				default:
					await ctx.reply('Unexpected step. Please try again.')
					break
			}
		}

		if (type_counter === '2') {
			if (ctx.session.stage === 'day_reading') {
				if (/^\d+$/.test(messageText)) {
					ctx.session.day_reading = messageText
					await ctx.reply(
						'🌙 Вкажіть, будь ласка, покази приладу обліку в нічний час:'
					)
					ctx.session.stage = 'night_reading'
				} else {
					await ctx.reply(
						'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
						{ parse_mode: 'HTML' }
					)
				}
			} else if (ctx.session.stage === 'night_reading') {
				if (/^\d+$/.test(messageText)) {
					ctx.session.night_reading = messageText
					const keyboardMarkup = new InlineKeyboard()
						.text('Надіслати', 'send_data')
						.text('Відмінити', 'get_addresses')
					const formattedMessage = `
					🌆 <b>Підрозділ:</b> ${remType[ctx.session.rem]}
🏠 <b>Адреса:</b> ${ctx.session.real_address}
💼 <b>Номер особового рахунку:</b> ${ctx.session.nomber_facture_p}
📱 <b>Номер телефону:</b> ${ctx.session.phonenumber_p}
💡 <b>Тип лічильника:</b> ${countType[ctx.session.type_counter]}
🌞 <b>Покази приладу вдень:</b> ${ctx.session.day_reading}
🌙 <b>Покази приладу вночі:</b> ${ctx.session.night_reading}`
					await ctx.reply(formattedMessage, {
						reply_markup: keyboardMarkup,
						parse_mode: 'HTML',
					})
				} else {
					await ctx.reply(
						'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
						{ parse_mode: 'HTML' }
					)
				}
			}
		} else if (type_counter === '3') {
			if (ctx.session.stage === 'day_reading') {
				if (/^\d+$/.test(messageText)) {
					ctx.session.day_reading = messageText
					await ctx.reply(
						'🌙 Вкажіть, будь ласка, покази приладу обліку в нічний час:'
					)
					ctx.session.stage = 'night_reading'
				} else {
					await ctx.reply(
						'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
						{ parse_mode: 'HTML' }
					)
				}
			} else if (ctx.session.stage === 'night_reading') {
				if (/^\d+$/.test(messageText)) {
					ctx.session.night_reading = messageText
					await ctx.reply(
						'⚡️ Вкажіть, будь ласка, покази приладу обліку в пік:'
					)
					// Устанавливаем этап ввода для пиковых показаний
					ctx.session.stage = 'peak_reading'
				} else {
					await ctx.reply(
						'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
						{ parse_mode: 'HTML' }
					)
				}
			} else if (ctx.session.stage === 'peak_reading') {
				if (/^\d+$/.test(messageText)) {
					ctx.session.peak_reading = messageText
					const keyboardMarkup = new InlineKeyboard()
						.text('Надіслати', 'send_data')
						.text('Відмінити', 'get_addresses')
					const formattedMessage = `
					🌆 <b>Підрозділ:</b> ${remType[ctx.session.rem]}
🏠 <b>Адреса:</b> ${ctx.session.real_address}
💼 <b>Номер особового рахунку:</b> ${ctx.session.nomber_facture_p}
📱 <b>Номер телефону:</b> ${ctx.session.phonenumber_p}
💡 <b>Тип лічильника:</b> ${countType[ctx.session.type_counter]}
🌞 <b>Покази приладу вдень:</b> ${ctx.session.day_reading}
🌙 <b>Покази приладу вночі:</b> ${ctx.session.night_reading}
⚡️ <b>Покази приладу в пік:</b> ${ctx.session.peak_reading}`
					await ctx.reply(formattedMessage, {
						reply_markup: keyboardMarkup,
						parse_mode: 'HTML',
					})
				} else {
					await ctx.reply(
						'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
						{ parse_mode: 'HTML' }
					)
				}
			}
		} else if (type_counter === '1') {
			if (/^\d+$/.test(messageText)) {
				ctx.session.day_reading = messageText
				const keyboardMarkup = new InlineKeyboard()
					.text('Надіслати', 'send_data')
					.text('Відмінити', 'get_address')
				const formattedMessage = `
				🌆 <b>Підрозділ:</b> ${remType[ctx.session.rem]}
🏠 <b>Адреса:</b> ${ctx.session.real_address}
💼 <b>Номер особового рахунку:</b> ${ctx.session.nomber_facture_p}
📱 <b>Номер телефону:</b> ${ctx.session.phonenumber_p}
💡 <b>Тип лічильника:</b> ${countType[ctx.session.type_counter]}
📊 <b>Покази приладу обліку:</b> ${messageText}`
				await ctx.reply(formattedMessage, {
					reply_markup: keyboardMarkup,
					parse_mode: 'HTML',
				})
			} else {
				await ctx.reply(
					'<b>🤬 Невірний формат показань. Будь ласка, введіть числове значення.</b>',
					{ parse_mode: 'HTML' }
				)
			}
		}
	} catch (err) {
		console.error('Error processing text message:', err.message)
		await ctx.reply('Failed to process text message.')
	}
})

bot.on('callback_query:data', async ctx => {
	try {
		const data = ctx.callbackQuery.data
		if (data === 'get_addresses') {
			ctx.session = {}
			return await ctx.reply(
				'🏠 Будь ласка вкажіть необхідну адресу /get_addresses для передачі показань'
			)
		}
		if (data.includes('select_rem')) {
			ctx.session.rem = data.split('|')[1]
			ctx.session.currentStep = 2
			return await ctx.reply('🏠 Вкажіть адресу:')
		}

		if (data.includes('select_countType')) {
			ctx.session.type_counter = data.split('|')[1]
			ctx.session.currentStep = 5
			return await ctx.reply('📱 Вкажіть номер телефону:')
		}

		if (data === 'save_address' && ctx.session.nomber_facture_p) {
			try {
				const response = await Address.create({
					chat_id: ctx.msg.chat.id,
					real_address: ctx.session.real_address,
					nomber_facture_p: ctx.session.nomber_facture_p,
					type_counter: ctx.session.type_counter,
					rem: ctx.session.rem,
					phonenumber_p: ctx.session.phonenumber_p,
				})
				console.log(response)
				ctx.session = {}
				if (response) {
					return await ctx.reply(
						'👌 Дякуємо! Ваша адреса успішно добавлена! /get_addresses'
					)
				} else {
					return await ctx.reply('😔 Щось пішло не так, спробуте пізніше')
				}
			} catch (err) {
				if (err && err.code === 11000) {
					return await ctx.reply(
						'☹️ Дані, які ви намагаєтесь зберегти, вже існують.'
					)
				} else {
					console.error(err)
					return await ctx.reply('😧 Виникла помилка. Спробуйте пізніше')
				}
			}
		}
		if (data === 'send_data') {
			const data = {
				rem: ctx.session.rem,
				type_counter: ctx.session.type_counter,
				pokazaniya_p: ctx.session.day_reading,
				pokazaniya_p2: ctx.session.night_reading,
				pokazaniya_p3: ctx.session.peak_reading,
				nomber_facture_p: ctx.session.nomber_facture_p,
				phonenumber_p: ctx.session.phonenumber_p,
				chackbox_p: 'on',
			}

			const filteredData = {}

			for (const key in data) {
				if (data[key] !== '' && data[key] !== undefined) {
					filteredData[key] = data[key]
				}
			}

			const response = await sendDataToServer(data)

			ctx.session = {}
			if (response) {
				return await ctx.reply('👌 Дякуємо! Вашi показники вiдправленi!')
			} else {
				ctx.session = {}
				return await ctx.reply(
					'🏠 Будь ласка вкажіть необхідну адресу /get_addresses для передачі показань'
				)
			}
		}

		const [
			chat_id,
			real_address,
			nomber_facture_p,
			type_counter,
			rem,
			phonenumber_p,
		] = data.split('|')
		ctx.session = {
			chat_id,
			real_address,
			nomber_facture_p,
			type_counter,
			rem,
			phonenumber_p,
		}

		if (type_counter === '1') {
			await ctx.reply('⚡️ Вкажіть, будь ласка, покази приладу обліку')
		} else if (type_counter === '2') {
			await ctx.reply(
				'🌞 Вкажіть, будь ласка, покази приладу обліку в денний час:'
			)
			ctx.session.stage = 'day_reading'
		} else if (type_counter === '3') {
			await ctx.reply('🌞 Вкажіть, будь ласка, покази приладу обліку в день:')
			ctx.session.stage = 'day_reading'
		} else {
			await ctx.reply(
				'🙁 Сталася помила. Будь ласка, зв`яжіться з вашим адміністратором або перезавантажте бота'
			)
		}
	} catch (err) {
		console.error('Error processing callback query:', err.message)
		await ctx.reply('Failed to process callback query.')
	}
})

bot.catch(err => {
	const ctx = err.ctx
	console.error(`Error while handling update ${ctx.update.update_id}:`)
	const e = err.error
	if (e instanceof GrammyError) {
		console.error('Error in request:', e.description)
	} else if (e instanceof HttpError) {
		console.error('Could not contact Telegram:', e)
	} else {
		console.error('Unknown error:', e)
	}
})

connectDb()
bot.start()
