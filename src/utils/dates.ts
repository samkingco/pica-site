function getLocale() {
	return typeof window === "undefined" ? "en-GB" : navigator.language;
}

export function formatDate(
	date: Date | null | undefined,
	format: "numeric" | "words" = "numeric",
	locale = getLocale()
): string {
	if (!date) return "";

	// Always display dates in PST (America/Vancouver) timezone
	const timeZone = "America/Vancouver";

	if (format === "words") {
		return new Intl.DateTimeFormat(locale, {
			dateStyle: "medium",
			timeZone,
		}).format(date);
	}

	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone,
	})
		.formatToParts(date)
		.reverse()
		.map((part) => (part.type === "literal" ? "-" : part.value))
		.join("");
}
