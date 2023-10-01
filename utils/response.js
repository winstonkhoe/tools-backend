const responseError = (res, status, errorMessage) => {
  res.status(status).json({
    error: {
      errorMessage: errorMessage
    }
  });
};

const responseSuccess = (res, data) => {
    res.status(200).json({
        data: data
    })
}

export { responseSuccess, responseError }
