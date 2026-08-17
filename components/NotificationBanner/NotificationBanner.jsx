"use client";
import { useEffect } from "react";
import styles from "./NotificationBanner.module.css";
export default function NotificationBanner({
    message,
    type = "error",
    onClose,
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return ( 
        <div className={`${styles.banner} ${styles[type]}`}>
            <div className={styles.content}>
                <div className={styles.icon}>
                    {type === "success" ? "✓" : "!"}
                </div>

                <span>{message}</span>

                <button onClick={onClose}>
                    x
                </button>
            </div>
        </div>
    );
}