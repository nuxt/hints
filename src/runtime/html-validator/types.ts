

export type HtmlValidateReport = {
    id: string,
    html: string,
    results: import('html-validate').Result[]
}