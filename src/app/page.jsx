"use client";

import styles from "./page.module.scss";
import Image from "next/image";
import { useState } from "react";
import Spinner from "./components/Spinner";

const languageMap = {
	en: "English",
	fr: "French",
	es: "Spanish",
	de: "German",
	it: "Italian",
	pt: "Portuguese",
	zh: "Chinese",
	ja: "Japanese",
	ko: "Korean",
	ru: "Russian",
	ar: "Arabic",
	hi: "Hindi",
	nl: "Dutch",
	sv: "Swedish",
	fi: "Finnish",
	no: "Norwegian",
	da: "Danish",
	pl: "Polish",
	tr: "Turkish",
	el: "Greek",
	he: "Hebrew",
	th: "Thai",
	id: "Indonesian",
	vi: "Vietnamese",
};

export default function Home() {
	const [currentMessage, setCurrentMessage] = useState("");
	const [messages, setMessages] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const options = {
		sharedContext: "This is a scientific article",
		type: "key-points",
		format: "markdown",
		length: "medium",
	};

	function newMessage(e) {
		setCurrentMessage(e.target.value);
	}

	function wordCount(text) {
		return text.trim().length;
	}

	async function sendMessage() {
		if (currentMessage.trim() === "") return;
		if (!currentMessage.trim()) return;
		const newEntry = {
			text: currentMessage,
			detectedLanguage: [],
			translatedText: "",
			summary: "",
			isTranslating: false,
			isSummarizing: false,
		};

		setMessages((prevMessages) => [...prevMessages, newEntry]);

		await detectTextLanguage(newEntry);

		setCurrentMessage("");
	}

	async function detectTextLanguage(messageEntry) {
		try {
			if (!self.ai || !self.ai.languageDetector) {
				console.error("Language detector is not available");
				return;
			}
			const capabilities = await self.ai.languageDetector.capabilities();

			const availability = capabilities.available;

			if (availability === "no") {
				console.error("Language detection is not supported");
				setIsLoading(true);
				return;
			}

			let detector;

			if (availability === "readily") {
				detector = await self.ai.languageDetector.create();
				const result = await detector.detect(messageEntry.text);
				const possibleLanguages = result
					.map((lang) => lang)
					.filter((lang) => lang.confidence > 0.1);
				setMessages((prevMessages) =>
					prevMessages.map((msg) =>
						msg.text === messageEntry.text
							? { ...msg, detectedLanguage: possibleLanguages }
							: msg
					)
				);
			} else {
				detector = await self.ai.languageDetector.create({
					monitor(m) {
						m.addEventListener("downloadprogress", (e) => {
							console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
						});
					},
				});
				await detector.ready;
			}
		} catch (error) {
			console.error("Error detecting language:", error);
		} finally {
			setIsLoading(false);
		}
	}

	async function summarizeText(index) {
		const text = messages[index].text;
		setMessages((prevMessages) =>
			prevMessages.map((msg, i) =>
				i === index ? { ...msg, isSummarizing: true } : msg
			)
		);
		try {
			if (!self.ai || !self.ai.summarizer) {
				console.error("Summarizer API is not available");
				return;
			}

			const available = (await self.ai.summarizer.capabilities()).available;

			if (available === "no") {
				console.error("Summarizer API is not available");
				return;
			}

			let summarizer;
			let summary = "";

			if (available === "readily") {
				summarizer = await self.ai.summarizer.create(options);
				summary = await summarizer.summarize(text);
			} else {
				summarizer = await self.ai.summarizer.create();
				summarizer.addEventListener("downloadprogress", (e) => {
					console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
				});
				await summarizer.ready;
				summary = await summarizer.summarize(text);
			}

			setMessages((prevMessages) =>
				prevMessages.map((msg, i) =>
					i === index ? { ...msg, summary, isSummarizing: false } : msg
				)
			);

			return summary;
		} catch (error) {
			console.error("Error in summarization:", error);
			setMessages((prevMessages) =>
				prevMessages.map((msg, i) =>
					i === index ? { ...msg, isSummarizing: false } : msg
				)
			);
		}
	}

	async function translateText(text, targetLanguage) {
		try {
			if (!self.ai || !self.ai.translator) {
				console.error("Translator API is not available");
				return;
			}

			const available = (await self.ai.translator.capabilities()).available;

			if (available === "no") {
				console.error("Translation is not supported");
				return;
			}

			let translator;
			let translatedText = "";

			const sourceLanguage =
				messages[0]?.detectedLanguage?.[0]?.detectedLanguage || "en";

			if (sourceLanguage === targetLanguage) {
				return text;
			}

			if (available === "readily") {
				translator = await self.ai.translator.create({
					sourceLanguage: sourceLanguage,
					targetLanguage: targetLanguage ? targetLanguage : "en",
				});
				translatedText = await translator.translate(text ? text : "");
			} else {
				translator = await self.ai.translator.create({
					sourceLanguage: sourceLanguage,
					targetLanguage: targetLanguage,
				});
				translator.addEventListener("downloadprogress", (e) => {
					console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
				});
				await translator.ready;
				translatedText = await translator.translate(text ? text : "");
			}

			return translatedText;
		} catch (error) {
			console.error("Error in translation:", error);
		}
	}

	function handleChange(e, index) {
		const newLanguage = e.target.value;
		setMessages((prevMessages) =>
			prevMessages.map((msg, i) =>
				i === index ? { ...msg, selectedLanguage: newLanguage } : msg
			)
		);
	}

	async function handleTranslate(index) {
		const text = messages?.[0].text;
		const targetLanguage = messages[index]?.selectedLanguage || "en";
		if (!text || !targetLanguage) return;

		setMessages((prevMessages) =>
			prevMessages.map((msg, i) =>
				i === index ? { ...msg, isTranslating: true } : msg
			)
		);

		try {
			const translatedText = await translateText(text, targetLanguage);

			setMessages((prevMessages) =>
				prevMessages.map((msg, i) =>
					i === index ? { ...msg, translatedText, isTranslating: false } : msg
				)
			);
		} catch (error) {
			console.error("Error translating message:", error);
			setMessages((prevMessages) =>
				prevMessages.map((msg, i) =>
					i === index ? { ...msg, isTranslating: false } : msg
				)
			);
		}
	}

	return (
		<div className={styles.page}>
			<div className={styles.logoContainer}>
				<h1>AI TEXT PROCESSOR</h1>
			</div>

			<div className={styles.MessageContainer}>
				{messages?.map((message, index) => (
					<div key={index}>
						<div className={styles.Message}>{message.text}</div>
						<div>
							{isLoading ? (
								<>
									<p>
										hold on while language detector sets up, this might take a
										while
									</p>
									<Spinner />
								</>
							) : (
								message?.detectedLanguage.length > 0 && (
									<>
										<div className={styles.LanguageDetectedContainer}>
											<p className={styles.LanguageDetected}>
												{`Your input text is in ${
													message?.detectedLanguage.length > 0
														? message.detectedLanguage
																.map(
																	(lang) =>
																		languageMap[lang.detectedLanguage] ||
																		"an unknown"
																)
																.join(" or ")
														: "an unknown"
												} language`}
											</p>
											{message.translatedText && (
												<p className={styles.TranslatedText}>
													{`Translated text: ${message.translatedText}`}
												</p>
											)}
											{message.isTranslating && (
												<div className={styles.TranslationLoading}>
													translation loading.... <Spinner />
												</div>
											)}
											{message.summary && (
												<p className={styles.Summary}>{message.summary}</p>
											)}
											<label htmlFor={`languageOptions-${index}`}></label>
											<select
												onChange={(e) => handleChange(e, index)}
												className={styles.LanguageOptions}
												name="languageOptions"
												id={`languageOptions-${index}`}
												value={message.selectedLanguage || "en"}
											>
												<option value="en">English</option>
												<option value="pt">Portuguese</option>
												<option value="es">Spanish</option>
												<option value="ru">Russian</option>
												<option value="tr">Turkish</option>
												<option value="fr">French</option>
											</select>

											<div className={styles.buttonContainer}>
												{wordCount(message.text) > 150 && (
													<button
														onClick={() => {
															summarizeText(index);
														}}
													>
														{message.isSummarizing ? <Spinner /> : "summarize"}
													</button>
												)}
												<button onClick={() => handleTranslate(index)}>
													translate
												</button>
											</div>
										</div>
									</>
								)
							)}
						</div>
					</div>
				))}
			</div>
			<div className={styles.TextContainer}>
				<label htmlFor="messageInput"></label>
				<input
					onInput={(e) => newMessage(e)}
					value={currentMessage}
					type="text"
					id="messageInput"
					placeholder="Enter your message"
				/>
				<button onClick={sendMessage} aria-label="Send message">
					<Image
						src="/paper-plane-regular.svg"
						alt="send"
						width={20}
						height={20}
					/>
				</button>
			</div>
		</div>
	);
}
