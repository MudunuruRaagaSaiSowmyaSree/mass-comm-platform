import { useState } from "react";
import Register from "./Register";
import AudienceManager from "./AudienceManager";

function App() {
  const [registered, setRegistered] = useState(true);

  if (!registered) {
    return <Register onSuccess={() => setRegistered(true)} />;
  }

  return <AudienceManager />;
}

export default App;