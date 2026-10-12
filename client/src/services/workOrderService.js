import api from './api';

export const workOrderService = {
  /**
   * GET /api/work-orders
   * For KCode employees: returns only their own work orders (backend filters by JWT kcode).
   * For Admin/Manager: optionally pass kcodeFilter to filter by a specific KCode.
   */
  getWorkOrders: async (kcodeFilter = null) => {
    const params = {};
    if (kcodeFilter) params.kcode = kcodeFilter;
    const response = await api.get('/work-orders', { params });
    return response.data;
  },

  /**
   * GET /api/work-orders/:id
   * Backend verifies the work order belongs to the authenticated KCode user.
   */
  /**
   * GET /api/work-orders/:id/download
   * Downloads the PDF securely by streaming from Google Drive via the backend.
   */
  downloadWorkOrderPdf: async (id, fileName) => {
    try {
      const response = await api.get(`/work-orders/${id}/download`, {
        responseType: 'blob', // crucial for receiving binary data
      });
      
      // Create a temporary URL for the downloaded blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Create an invisible anchor tag to trigger the download
      const link = document.createElement('a');
      link.href = url;
      
      // Use the actual filename from the server if possible, or fallback to passed fileName
      const contentDisposition = response.headers['content-disposition'];
      let downloadFileName = fileName || 'WorkOrder.pdf';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (fileNameMatch && fileNameMatch[1]) {
          downloadFileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json && json.message) {
            err.message = json.message;
          }
        } catch (e) {
          // ignore error parsing
        }
      }
      throw err;
    }
  },

  /**
   * GET /api/work-orders/:id/download
   * Opens the PDF securely in a new browser tab for viewing.
   */
  viewWorkOrderPdf: async (id) => {
    try {
      const response = await api.get(`/work-orders/${id}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json && json.message) {
            err.message = json.message;
          }
        } catch (e) {
          // ignore error parsing
        }
      }
      throw err;
    }
  },
};
