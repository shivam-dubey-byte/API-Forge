import React, { useState, useEffect } from 'react';

// --- SVG Icon Library ---
const ICONS = {
    SEND: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    COPY: "M9 5.25a.75.75 0 01.75-.75h6a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V6h-4.5a.75.75 0 01-.75-.75z",
    CHECK: "M4.5 12.75l6 6 9-13.5",
    PLUS: "M12 4.5v15m7.5-7.5h-15",
    TRASH: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
};

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
    const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
    const [headers, setHeaders] = useState('{\n  "Content-type": "application/json; charset=UTF-8"\n}');
    const [params, setParams] = useState([{ id: crypto.randomUUID(), key: 'id', value: '1', enabled: true }]);
    
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('params');
    const [statusCode, setStatusCode] = useState(null);
    const [responseTime, setResponseTime] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const methodsWithBody = ['POST', 'PUT', 'PATCH'];

    // --- EFFECT to build URL from params ---
    useEffect(() => {
        try {
            const baseUrl = url.split('?')[0];
            const activeParams = params.filter(p => p.enabled && p.key);
            if (activeParams.length > 0) {
                const searchParams = new URLSearchParams(activeParams.map(p => [p.key, p.value]));
                setUrl(`${baseUrl}?${searchParams.toString()}`);
            } else {
                setUrl(baseUrl);
            }
        } catch (error) {
            // Silently fail on invalid URL, user is likely typing
        }
    }, [params, url]);

    // --- API CALL LOGIC ---
    const handleSendRequest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        setStatusCode(null);
        setResponseTime(null);
        setIsCopied(false);
        const startTime = Date.now();

        try {
            let parsedBody = null;
            let parsedHeaders = {};
            if (methodsWithBody.includes(method)) {
                try { parsedBody = JSON.parse(body); } catch (e) { throw new Error("Invalid JSON in Body"); }
            }
            try { parsedHeaders = JSON.parse(headers); } catch (e) { throw new Error("Invalid JSON in Headers"); }

            const options = {
                method,
                headers: new Headers(parsedHeaders),
                body: parsedBody ? JSON.stringify(parsedBody) : undefined,
            };

            const res = await fetch(url, options);
            const endTime = Date.now();
            setResponseTime(endTime - startTime);
            setStatusCode(res.status);

            const responseData = await res.json();
            setResponse(JSON.stringify(responseData, null, 2));

        } catch (err) {
            const endTime = Date.now();
            setResponseTime(endTime - startTime);
            setError(err.message || 'An unexpected error occurred.');
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCopyResponse = () => {
        if (!response) return;
        const ta = document.createElement('textarea');
        ta.value = response;
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(ta);
    };

    // --- RENDER METHOD ---
    return (
        <div className="bg-gradient-to-br from-gray-900 to-black text-gray-200 min-h-screen font-sans flex flex-col p-4">
            <header className="mb-6 text-center">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500">
                    API Forge
                </h1>
                <p className="text-gray-400 mt-1">Craft and Test Your APIs with Elegance</p>
            </header>

            {/* Request Section */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 w-full sm:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                    <option>HEAD</option>
                    <option>OPTIONS</option>
                </select>
                <input
                    type="text"
                    value={url.split('?')[0]}
                    onChange={(e) => {
                       const currentParams = url.includes('?') ? url.split('?')[1] : '';
                       setUrl(currentParams ? `${e.target.value}?${currentParams}` : e.target.value);
                    }}
                    placeholder="Enter API URL"
                    className="flex-grow bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                />
                <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                        <Icon path={ICONS.SEND} className="w-5 h-5"/>
                    )}
                    <span>Send</span>
                </button>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50vh]">
                {/* Request Payload Section */}
                <div className="flex flex-col bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center bg-gray-900/30 border-b border-gray-700/50 p-1 gap-1">
                        <TabButton name="Params" activeTab={activeTab} onClick={() => setActiveTab('params')} />
                        <TabButton name="Body" activeTab={activeTab} onClick={() => setActiveTab('body')} disabled={!methodsWithBody.includes(method)} />
                        <TabButton name="Headers" activeTab={activeTab} onClick={() => setActiveTab('headers')} />
                    </div>
                    <div className="flex-grow p-2 overflow-y-auto">
                        {activeTab === 'body' && <JsonEditor value={body} onChange={setBody} placeholder='Enter JSON body...' disabled={!methodsWithBody.includes(method)} />}
                        {activeTab === 'headers' && <JsonEditor value={headers} onChange={setHeaders} placeholder='Enter JSON headers...' />}
                        {activeTab === 'params' && <ParamsEditor params={params} setParams={setParams} />}
                    </div>
                </div>

                {/* Response Section */}
                <div className="flex flex-col bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-900/30 p-3 border-b border-gray-700/50">
                       <div className="flex items-center gap-4">
                           <h2 className="text-lg font-semibold">Response</h2>
                           {statusCode && (
                                <span className={`font-bold text-sm px-2 py-0.5 rounded-md text-white ${
                                    statusCode >= 200 && statusCode < 300 ? 'bg-green-600/80' : 'bg-red-600/80'
                                }`}>
                                   {statusCode}
                               </span>
                           )}
                           {responseTime && <span className="text-gray-400 text-sm">{responseTime}ms</span>}
                       </div>
                       <button onClick={handleCopyResponse} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!response}>
                            {isCopied ? <Icon path={ICONS.CHECK} className="w-5 h-5 text-green-400" /> : <Icon path={ICONS.COPY} className="w-5 h-5" />}
                       </button>
                    </div>
                    <div className="flex-grow p-1 relative">
                       {loading && (
                           <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10">
                               <div className="w-8 h-8 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
                           </div>
                       )}
                       <textarea
                            readOnly
                            value={error ? `Error: ${error}` : response || 'Click "Send" to get a response...'}
                            className={`w-full h-full min-h-[200px] bg-transparent p-3 font-mono text-sm resize-none focus:outline-none ${error ? 'text-red-400' : 'text-green-300'}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Child Components ---
const TabButton = ({ name, activeTab, onClick, disabled = false }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50
            ${activeTab === name.toLowerCase() ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}
            ${disabled ? 'text-gray-600 cursor-not-allowed hover:bg-transparent' : ''}
        `}
    >
        {name}
    </button>
);

const JsonEditor = ({ value, onChange, placeholder, disabled }) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? `Body not applicable for current method` : placeholder}
        disabled={disabled}
        className="w-full h-full min-h-[200px] bg-transparent text-gray-300 p-2 font-mono text-sm resize-none focus:outline-none disabled:text-gray-500"
    />
);

const ParamsEditor = ({ params, setParams }) => {
    const handleParamChange = (id, field, value) => {
        setParams(params.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addParam = () => {
        setParams([...params, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
    };
    
    const removeParam = (id) => {
        setParams(params.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-2">
            {params.map((param, index) => (
                <div key={param.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={param.enabled} onChange={(e) => handleParamChange(param.id, 'enabled', e.target.checked)} className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                    <input type="text" value={param.key} onChange={(e) => handleParamChange(param.id, 'key', e.target.value)} placeholder="Key" className="flex-grow bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    <input type="text" value={param.value} onChange={(e) => handleParamChange(param.id, 'value', e.target.value)} placeholder="Value" className="flex-grow bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    <button onClick={() => removeParam(param.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1"><Icon path={ICONS.TRASH} className="w-5 h-5"/></button>
                </div>
            ))}
            <button onClick={addParam} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm py-1 px-2 rounded-md hover:bg-cyan-500/10 transition-colors">
                <Icon path={ICONS.PLUS} className="w-4 h-4"/> Add Param
            </button>
        </div>
    );
};

