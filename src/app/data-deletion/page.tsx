const DataDeletion = () => {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Data Deletion Instructions</h1>
        <p className="mb-4">
          If you want to delete your account and all associated data from our platform, please follow these instructions.
        </p>
  
        <h2 className="text-2xl font-semibold mt-4">1. Automatic Data Deletion (If Available)</h2>
        <p>If our platform provides an option to delete your account from your profile settings, use that feature.</p>
  
        <h2 className="text-2xl font-semibold mt-4">2. Manual Data Deletion Request</h2>
        <p>
          If you want to manually request data deletion, please send an email to <strong>support@yourwebsite.com</strong>  
          with the subject <strong>"Data Deletion Request"</strong> and include your registered email address.
        </p>
  
        <h2 className="text-2xl font-semibold mt-4">3. Processing Time</h2>
        <p>
          Your request will be processed within 7 business days. You will receive a confirmation email once your data has been deleted.
        </p>
      </div>
    );
  };
  
  export default DataDeletion;
  