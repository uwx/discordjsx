import "../src/index.js"
import React, { useEffect, useState } from "react";
import { djsx } from "./index.js"

export const Counter = () => {
    const [count, setCount] = useState(0);
    const [error, setError] = useState(false);
    const [doThrow, setDoThrow] = useState(false);

    if (doThrow) throw new Error("This error should be displayed on discord");

    // useEffect(() => {
    //     const i = setInterval(() => {
    //         setCount(c => c+1);
    //     }, 10 * 1000);
    //     return () => clearInterval(i);
    // }, []);

    return (
        <message v2 ephemeral>
            {error && (
                <button>
                    error
                </button>
            )}
            <container>
                <text>
                    Counter: **{count}**
                </text>
                <row>
                    <button
                        style="danger"
                        onClick={() => setCount(c => c - 1)}
                    >
                        -1
                    </button>
                    <button
                        style="success"
                        onClick={() => setCount(c => c + 1)}
                    >
                        +1
                    </button>
                </row>
                <row>
                    <button style="secondary">
                        No Event Handler
                    </button>
                    <button style="danger" onClick={() => setError(true)}>
                        Make payload invalid
                    </button>
                    <button style="danger" onClick={() => setDoThrow(true)}>
                        Make component throw
                    </button>
                </row>
                <row>
                    <button onClick={(buttonInteraction) => {
                        djsx.createModal(buttonInteraction, (
                            <modal title="Example" onSubmit={async (form, int) => {
                                console.log("Form submitted", form)
                                await int.deferUpdate();
                            }}>
                                <row>
                                    <text-input
                                        label="Name"
                                        customId="name"
                                    />
                                </row>
                            </modal>
                        ))
                    }}>
                        Open modal
                    </button>
                </row>
            </container>
        </message>
    )
};
