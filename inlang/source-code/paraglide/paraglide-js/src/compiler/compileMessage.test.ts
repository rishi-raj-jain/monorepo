import { it, expect } from "vitest"
import { compileMessage } from "./compileMessage.js"

it("should throw if a message uses `-` because `-` are invalid JS function names", () => {
	expect(() =>
		compileMessage({
			id: "message-with-invalid-js-variable-name",
			selectors: [],
			variants: [],
		})
	).toThrow()
})

it("should throw an error if a message has multiple variants with the same language tag", () => {
	expect(() =>
		compileMessage({
			id: "duplicateLanguageTag",
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en",
					pattern: [],
				},
				{
					match: [],
					languageTag: "en",
					pattern: [],
				},
			],
		})
	).toThrow()
})

it("should compile a message with a language tag that contains a hyphen - to an underscore to prevent invalid JS imports", async () => {
	const result = compileMessage({
		id: "login_button",
		selectors: [],
		variants: [
			{
				match: [],
				languageTag: "en-US",
				pattern: [],
			},
		],
	})
	expect(result.en_US).toBeUndefined()
	expect(result["en-US"]).toBeDefined()
	expect(result.index.includes("en_US.login_button")).toBe(true)
	expect(result.index.includes("en-US.login_button")).toBe(false)
})

it("should compile a message to a function", async () => {
	const result = compileMessage({
		id: "multipleParams",
		selectors: [],
		variants: [
			{
				match: [],
				languageTag: "en",
				pattern: [
					{
						type: "Text",
						value: "Hello ",
					},
					{
						type: "VariableReference",
						name: "name",
					},
					{
						type: "Text",
						value: "! You have ",
					},
					{
						type: "VariableReference",
						name: "count",
					},
					{
						type: "Text",
						value: " messages.",
					},
				],
			},
			{
				match: [],
				languageTag: "de",
				pattern: [
					{
						type: "Text",
						value: "Hallo ",
					},
					{
						type: "VariableReference",
						name: "name",
					},
					{
						type: "Text",
						value: "! Du hast ",
					},
					{
						type: "VariableReference",
						name: "count",
					},
					{
						type: "Text",
						value: " Nachrichten.",
					},
				],
			},
		],
	})
	const de = await import(
		`data:application/javascript;base64,${btoa("let languageTag = () => 'de';" + result.de)}`
	)
	const en = await import(
		`data:application/javascript;base64,${btoa("let languageTag = () => 'en';" + result.en)}`
	)
	expect(de.multipleParams({ name: "Samuel", count: 5 })).toBe(
		"Hallo Samuel! Du hast 5 Nachrichten."
	)
	expect(en.multipleParams({ name: "Samuel", count: 5 })).toBe("Hello Samuel! You have 5 messages.")
})
