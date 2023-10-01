import { SOCKET_EVENT } from './constants.js';

const emitEnrichmentAutomationFillLogBookStatus = (socket, status) => {
  if (socket && status && status !== '') {
    socket.emit(
      SOCKET_EVENT.enrichmentAutomation.fillLogBook.status,
      status,
      new Date() / 1
    );
  }
};

const emitEnrichmentAutomationFillLogBookSuccess = (socket) => {
  if (socket) {
    socket.emit(
      SOCKET_EVENT.enrichmentAutomation.fillLogBook.success,
      new Date() / 1
    );
  }
};

const emitEnrichmentAutomationFillLogBookError = (socket) => {
  if (socket) {
    socket.emit(
      SOCKET_EVENT.enrichmentAutomation.fillLogBook.error,
      new Date() / 1
    );
  }
};

export {
  emitEnrichmentAutomationFillLogBookStatus,
  emitEnrichmentAutomationFillLogBookSuccess,
  emitEnrichmentAutomationFillLogBookError
};
