import { useState } from "react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Password input with show/hide toggle.
 * Sir requirement: every password field must have a visibility toggle.
 */
export function PasswordInput({ style, ...props }: PasswordInputProps) {
    const [show, setShow] = useState(false);
    return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", width: "100%" }}>
            <input
                {...props}
                type={show ? "text" : "password"}
                style={{ ...style, width: "100%", paddingRight: 36 }}
            />
            <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
                style={{
                    position: "absolute", right: 6, background: "none", border: 0,
                    cursor: "pointer", fontSize: 16, padding: 4, opacity: 0.7,
                }}
            >
                {show ? "🙈" : "👁️"}
            </button>
        </span>
    );
}
