const normalizeDate = (date) => {
    date.setUTCHours(0, 0, 0, 0);
}

export { normalizeDate }