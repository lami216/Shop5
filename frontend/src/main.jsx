import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import LanguageProvider from "./components/LanguageProvider.jsx";

createRoot(document.getElementById("root")).render(
        <StrictMode>
                <LanguageProvider>
                        <BrowserRouter>
                                <App />
                        </BrowserRouter>
                </LanguageProvider>
        </StrictMode>
);
