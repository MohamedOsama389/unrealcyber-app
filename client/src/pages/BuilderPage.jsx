import React, { useEffect, useState } from "react";
import { BuilderComponent, builder, useIsPreviewing } from "@builder.io/react";
import { useParams } from "react-router-dom";
import "../builder-registry"; // Import the registry to enable custom components

// Initialize Builder with your API Key
// TODO: Put this in your .env file as VITE_BUILDER_API_KEY
builder.init(import.meta.env.VITE_BUILDER_API_KEY || "YOUR_API_KEY_HERE");

export default function BuilderPage() {
    const [content, setContent] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const isPreviewing = useIsPreviewing();

    // Get the path from the URL, or default to "/"
    // We use a wildcard route in App.jsx, so we might need to construct the URL
    const urlPath = window.location.pathname;

    useEffect(() => {
        async function fetchContent() {
            const content = await builder
                .get("page", {
                    userAttributes: {
                        urlPath: urlPath,
                    },
                })
                .promise();

            if (content) {
                setContent(content);
                setNotFound(false);
            } else {
                setNotFound(true);
            }
        }
        fetchContent();
    }, [urlPath]);

    // If no content is found and we are not previewing in Builder, show 404
    if (notFound && !isPreviewing) {
        return (
            <div className="flex items-center justify-center min-h-screen text-slate-300 bg-[#0d1526]">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p>Page Not Found (Builder.io)</p>
                </div>
            </div>
        );
    }

    // Render the Builder content
    return (
        <div className="builder-content">
            <BuilderComponent model="page" content={content} />
        </div>
    );
}
