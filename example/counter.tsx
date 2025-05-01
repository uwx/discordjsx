import "../"
import React, { useState } from "react";

export const Counter = () => {
    const [count, setCount] = useState(0);

    return (
        <message v2 ephemeral>
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
                </row>
            </container>
        </message>
    )
};
