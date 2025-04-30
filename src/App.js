import React, { useState, useEffect } from 'react';
import SignUpForm from './components/SignUpForm';
import SignInForm from './components/SignInForm';
import { checkIfLoggedIn, logOut } from './utils/auth'; // Custom functions to handle login status

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if the user is logged in
    const currentUser = checkIfLoggedIn(); // This could be a check against local storage or Supabase
    setUser(currentUser);
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.name}!</h1>
          <button onClick={() => logOut(setUser)}>Log Out</button>
        </div>
      ) : (
        <div>
          <SignInForm />
          <SignUpForm />
        </div>
      )}
    </div>
  );
};

export default App;
