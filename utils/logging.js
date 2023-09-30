const log = (message) => {
    console.log(`[${getTimestamp()}] - ${message}`);
  };
  
  const getTimestamp = () => {
    const date = new Date();
    const milliseconds = date.getMilliseconds();
    return `${date.toLocaleTimeString("en-US", { hour12: false })}.${milliseconds}`;
  };
  
  export { log };