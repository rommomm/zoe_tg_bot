import axios from 'axios'
import https from 'https'

export const countType = {
	1: 'Однозонний лічильник',
	2: 'Двузонний лічильник',
	3: 'Тризонний лічильник',
}

export const remType = {
	53: 'Бердянський міський РЕМ',
	57: 'Бердянський РЕМ',
	64: 'Більмацький РЕМ',
	58: 'Василівський РЕМ',
	59: 'Веселівський РЕМ',
	60: 'Вільнянський РЕМ',
	61: 'Гуляйпільський РЕМ',
	93: 'Енергодарський РЕМ',
	55: 'Запорізькі міські електричні мережі',
	62: 'Запорізький РЕМ',
	63: 'Кам`янко-Дніпровський РЕМ',
	54: 'Мелітопольський міський РЕМ',
	65: 'Мелітопольський РЕМ',
	66: 'Михайлівський РЕМ',
	67: 'Новомиколаївський РЕМ',
	68: 'Оріхівський РЕМ',
	69: 'Пологівський РЕМ',
	70: 'Приазовський РЕМ',
	71: 'Приморський РЕМ',
	72: 'Розівський РЕМ',
	73: 'Токмацький РЕМ',
	74: 'Чернігівський РЕМ',
	56: 'Якимівський РЕМ',
}

export async function sendDataToServer(data) {
	try {
		if (!data.nomber_facture_p) {
			return false
		}
		const formData = new FormData()
		for (const key in data) {
			formData.append(key, data[key])
		}

		const response = await axios.post(
			'https://www.zoe.com.ua/pokazania.php',
			formData,
			{
				headers: {
					Accept:
						'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
					'Accept-Encoding': 'gzip, deflate, br, zstd',
					'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
					'Cache-Control': 'max-age=0',
					'Content-Type': 'application/x-www-form-urlencoded',
					Host: 'www.zoe.com.ua',
					Origin: 'https://www.zoe.com.ua',
					Referer: 'https://www.zoe.com.ua/pokazania.php',
					'Sec-Ch-Ua':
						'"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
					'Sec-Ch-Ua-Mobile': '?0',
					'Sec-Ch-Ua-Platform': '"Windows"',
					'Sec-Fetch-Dest': 'document',
					'Sec-Fetch-Mode': 'navigate',
					'Sec-Fetch-Site': 'same-origin',
					'Sec-Fetch-User': '?1',
					'Upgrade-Insecure-Requests': '1',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
				},
				// httpsAgent: new https.Agent({
				// 	rejectUnauthorized: false,
				// }),
			}
		)

		if (response.status != 200) {
			throw new Error(`Failed to send data to server: ${response.statusText}`)
		}

		return response.status === 200
	} catch (error) {
		console.error('Error sending data to server:', error.message)
		throw error
	}
}
