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
	// const [translatedOptions, setTranslatedOptions] = useState("en");
	const [translationLoading, setTranslationLoading] = useState(false);
	const options = {
		sharedContext: "This is a scientific article",
		type: "key-points",
		format: "markdown",
		length: "medium",
	};
	console.log(messages);

	function newMessage(e) {
		setCurrentMessage(e.target.value);
	}

	async function sendMessage() {
		if (currentMessage.trim() === "") return;
		if (!currentMessage.trim()) return;
		const newEntry = {
			text: currentMessage,
			detectedLanguage: [],
			translatedText: "",
			summary: "",
		};

		setMessages((prevMessages) => [...prevMessages, newEntry]);

		await detectTextLanguage(newEntry);

		// const summary = await summarizeText(currentMessage);

		// if (summary) {
		// 	setMessages((prevMessages) => [...prevMessages, `Summary: ${summary}`]);
		// }

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

	async function summarizeText(text) {
		try {
			if (!self.ai || !self.ai.summarizer) {
				console.error("Summarizer API is not available");
				return;
			}

			const available = (await self.ai.summarizer.capabilities()).available;

			if (available === "no") {
				console.error("Summarizer API is not available");
				// setIsLoading(true);
				return;
			}

			let summarizer;
			let summary = "";

			if (available === "readily") {
				console.log("readily");
				summarizer = await self.ai.summarizer.create(options);
				console.log("🔹 summarizeText() called with text:", text);
				summary = await summarizer.summarize(text);
			} else {
				summarizer = await self.ai.summarizer.create();
				summarizer.addEventListener("downloadprogress", (e) => {
					console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
				});
				await summarizer.ready;
				summary = await summarizer.summarize(text);
			}

			setMessages((prevMessages) => [...prevMessages, `Summary: ${summary}`]);
			console.log("messages set successfully");

			return summary;
		} catch (error) {
			console.error("Error in summarization:", error);
		} finally {
			// setIsLoading(false);
		}
	}

	async function translateText(text, targetLanguage) {
		try {
			if (!self.ai || !self.ai.translator) {
				console.error("Translator API is not available");
				return;
			}

			const available = (await self.ai.translator.capabilities()).available;
			console.log(available);

			if (available === "no") {
				console.error("Translation is not supported");
				return;
			}

			let translator;
			let translatedText = "";

			const sourceLanguage =
				messages[0]?.detectedLanguage?.[0]?.detectedLanguage || "auto";
			console.log(
				`sourcelanguage:${sourceLanguage},target language ${targetLanguage}`
			);

			if (available === "readily") {
				console.log("✅ Translator is readily available");
				translator = await self.ai.translator.create({
					sourceLanguage: sourceLanguage,
					targetLanguage: targetLanguage ? targetLanguage : "en",
				});
				translatedText = await translator.translate(text ? text : "");
			} else {
				console.log("⏳ Translator requires setup");
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

			console.log("🔹 Translated Text:", translatedText);
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
		// setTranslatedOptions(e.target.value);
	}

	async function handleTranslate(index) {
		const text = messages?.[0].text;
		const targetLanguage = messages[index]?.selectedLanguage || "en";
		if (!text || !targetLanguage) return;
		console.log(text, targetLanguage);
		setTranslationLoading(true);

		try {
			const translatedText = await translateText(text, targetLanguage);
			console.log(translatedText);
			setTranslationLoading(false);

			setMessages((prevMessages) =>
				prevMessages.map((msg, i) =>
					i === index ? { ...msg, translatedText } : msg
				)
			);

			console.log(`✅ Translated: ${translatedText}`);
		} catch (error) {
			console.error("Error translating message:", error);
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
											{translationLoading && (
												<div className={styles.TranslationLoading}>
													translation loading.... <Spinner />
												</div>
											)}
											<select
												onChange={(e) => handleChange(e, index)}
												className={styles.LanguageOptions}
												name="languageOptions"
												id=""
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
												<button>summarize</button>
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
				<input
					onInput={(e) => newMessage(e)}
					value={currentMessage}
					type="text"
					placeholder="Enter your message"
				/>
				<button onClick={sendMessage}>
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
