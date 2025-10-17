import React, { useState, useEffect } from 'react';

// --- SVG Icon Library ---
const ICONS = {
    SEND: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    COPY: "M9 5.25a.75.75 0 01.75-.75h6a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V6h-4.5a.75.75 0 01-.75-.75z",
    CHECK: "M4.5 12.75l6 6 9-13.5",
    PLUS: "M12 4.5v15m7.5-7.5h-15",
    TRASH: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
    HEART: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
};

const Icon = ({ path, className = "w-6 h-6", fill = "none" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={fill} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
    const [params, setParams] = useState([{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
    
    // Tabs state
    const [activeTab, setActiveTab] = useState('params');
    const [activeResponseTab, setActiveResponseTab] = useState('body');
    const [bodyType, setBodyType] = useState('raw'); // 'raw', 'formData', 'urlEncoded'
    
    // Body state
    const [rawBody, setRawBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
    const [formData, setFormData] = useState([{ id: crypto.randomUUID(), key: '', value: '', type: 'text', file: null, enabled: true }]);
    const [urlEncoded, setUrlEncoded] = useState([{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
    
    // Headers & Auth state
    const [headers, setHeaders] = useState('{\n  "Content-type": "application/json; charset=UTF-8"\n}');
    const [authType, setAuthType] = useState('none'); // 'none', 'bearer', 'basic', 'apiKey'
    const [bearerToken, setBearerToken] = useState('');
    const [basicUser, setBasicUser] = useState('');
    const [basicPass, setBasicPass] = useState('');
    const [apiKey, setApiKey] = useState({ key: '', value: '', addTo: 'header' });

    // Response state
    const [response, setResponse] = useState(null);
    const [responseHeaders, setResponseHeaders] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusCode, setStatusCode] = useState(null);
    const [responseTime, setResponseTime] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const methodsWithBody = ['POST', 'PUT', 'PATCH'];

    // --- EFFECT to build URL from params ---
    useEffect(() => {
        let finalUrl = url.split('?')[0];
        const activeParams = params.filter(p => p.enabled && p.key);
        
        const searchParams = new URLSearchParams();
        activeParams.forEach(p => searchParams.append(p.key, p.value));

        if (authType === 'apiKey' && apiKey.addTo === 'query' && apiKey.key) {
            searchParams.append(apiKey.key, apiKey.value);
        }

        if (Array.from(searchParams).length > 0) {
            finalUrl += `?${searchParams.toString()}`;
        }
        setUrl(finalUrl);
    }, [params, authType, apiKey]);

    // --- API CALL LOGIC ---
    const handleSendRequest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        setResponseHeaders(null);
        setStatusCode(null);
        setResponseTime(null);
        setIsCopied(false);
        const startTime = Date.now();

        try {
            // 1. Prepare Headers
            let finalHeaders = {};
            try { finalHeaders = JSON.parse(headers); } catch (e) { throw new Error("Invalid JSON in Headers"); }

            // Add Auth header
            if (authType === 'bearer' && bearerToken) finalHeaders['Authorization'] = `Bearer ${bearerToken}`;
            else if (authType === 'basic' && basicUser) finalHeaders['Authorization'] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
            else if (authType === 'apiKey' && apiKey.addTo === 'header' && apiKey.key) finalHeaders[apiKey.key] = apiKey.value;
            
            // 2. Prepare Body
            let requestBody;
            if (methodsWithBody.includes(method)) {
                if (bodyType === 'raw') {
                    finalHeaders['Content-Type'] = 'application/json';
                    try { requestBody = JSON.stringify(JSON.parse(rawBody)); } catch (e) { throw new Error("Invalid JSON in Body"); }
                } else if (bodyType === 'formData') {
                    delete finalHeaders['Content-Type']; delete finalHeaders['content-type'];
                    const fd = new FormData();
                    formData.forEach(item => {
                        if (item.enabled && item.key) {
                           if (item.type === 'file' && item.file) fd.append(item.key, item.file);
                           else fd.append(item.key, item.value);
                        }
                    });
                    requestBody = fd;
                } else if (bodyType === 'urlEncoded') {
                    finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
                    const activeUrlEncoded = urlEncoded.filter(p => p.enabled && p.key);
                    requestBody = new URLSearchParams(activeUrlEncoded.map(p => [p.key, p.value])).toString();
                }
            }

            const options = { method, headers: new Headers(finalHeaders), body: requestBody };

            const res = await fetch(url, options);
            const endTime = Date.now();
            setResponseTime(endTime - startTime);
            setStatusCode(res.status);
            
            const headersObject = {};
            res.headers.forEach((value, key) => { headersObject[key] = value; });
            setResponseHeaders(JSON.stringify(headersObject, null, 2));

            const responseText = await res.text();
            try {
                setResponse(JSON.stringify(JSON.parse(responseText), null, 2));
            } catch {
                setResponse(responseText);
            }

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
        const contentToCopy = activeResponseTab === 'body' ? response : responseHeaders;
        if (!contentToCopy) return;
        const ta = document.createElement('textarea');
        ta.value = contentToCopy;
        ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) { console.error('Failed to copy text: ', err); }
        document.body.removeChild(ta);
    };

    // --- RENDER METHOD ---
    return (
        <div className="bg-gradient-to-br from-gray-900 to-black text-gray-200 min-h-screen font-sans flex flex-col p-4">
            <main className="flex-grow">
                <header className="mb-6 text-center">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500">API Forge</h1>
                    <p className="text-gray-400 mt-1">Craft and Test Your APIs with Elegance</p>
                </header>

                {/* Request Section */}
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 w-full sm:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
                        <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
                    </select>
                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter API URL" className="flex-grow bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors" />
                    <button onClick={handleSendRequest} disabled={loading} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105">
                        {loading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <Icon path={ICONS.SEND} className="w-5 h-5"/>}
                        <span>Send</span>
                    </button>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50vh]">
                    {/* Request Payload Section */}
                    <div className="flex flex-col bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden">
                        <div className="flex items-center bg-gray-900/30 border-b border-gray-700/50 p-1 gap-1">
                            <TabButton name="Params" activeTab={activeTab} onClick={() => setActiveTab('params')} />
                            <TabButton name="Auth" activeTab={activeTab} onClick={() => setActiveTab('auth')} />
                            <TabButton name="Headers" activeTab={activeTab} onClick={() => setActiveTab('headers')} />
                            <TabButton name="Body" activeTab={activeTab} onClick={() => setActiveTab('body')} disabled={!methodsWithBody.includes(method)} />
                        </div>
                        <div className="flex-grow p-2 overflow-y-auto">
                            {activeTab === 'params' && <ParamsEditor params={params} setParams={setParams} />}
                            {activeTab === 'auth' && <AuthEditor authType={authType} setAuthType={setAuthType} apiKey={apiKey} setApiKey={setApiKey} bearerToken={bearerToken} setBearerToken={setBearerToken} basicUser={basicUser} setBasicUser={setBasicUser} basicPass={basicPass} setBasicPass={setBasicPass} />}
                            {activeTab === 'headers' && <JsonEditor value={headers} onChange={setHeaders} placeholder='Enter JSON headers...' />}
                            {activeTab === 'body' && <BodyEditor bodyType={bodyType} setBodyType={setBodyType} rawBody={rawBody} setRawBody={setRawBody} formData={formData} setFormData={setFormData} urlEncoded={urlEncoded} setUrlEncoded={setUrlEncoded} disabled={!methodsWithBody.includes(method)} />}
                        </div>
                    </div>

                    {/* Response Section */}
                    <div className="flex flex-col bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-900/30 p-1 border-b border-gray-700/50">
                           <div className="flex items-center gap-1">
                                <TabButton name="Body" activeTab={activeResponseTab} onClick={() => setActiveResponseTab('body')} />
                                <TabButton name="Headers" activeTab={activeResponseTab} onClick={() => setActiveResponseTab('headers')} />
                           </div>
                           <div className="flex items-center gap-4 px-3">
                               {statusCode && <span className={`font-bold text-sm px-2 py-0.5 rounded-md text-white ${ statusCode >= 200 && statusCode < 300 ? 'bg-green-600/80' : 'bg-red-600/80' }`}>{statusCode}</span>}
                               {responseTime && <span className="text-gray-400 text-sm">{responseTime}ms</span>}
                               <button onClick={handleCopyResponse} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!response}>
                                    {isCopied ? <Icon path={ICONS.CHECK} className="w-5 h-5 text-green-400" /> : <Icon path={ICONS.COPY} className="w-5 h-5" />}
                               </button>
                           </div>
                        </div>
                        <div className="flex-grow p-1 relative">
                           {loading && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"><div className="w-8 h-8 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div></div>}
                           <textarea readOnly value={error ? `Error: ${error}` : (activeResponseTab === 'body' ? response : responseHeaders) || 'Click "Send" to get a response...'} className={`w-full h-full min-h-[200px] bg-transparent p-3 font-mono text-sm resize-none focus:outline-none ${error ? 'text-red-400' : 'text-green-300'}`} />
                        </div>
                    </div>
                </div>
            </main>
            <footer className="text-center p-4 mt-6 text-gray-500">
                Crafted with <Icon path={ICONS.HEART} className="w-5 h-5 inline-block text-red-500" fill="currentColor"/> by <a href="http://www.quantumsoftdev.in" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">QuantumSoftDev</a>
            </footer>
        </div>
    );
}

// --- Child Components ---
const TabButton = ({ name, activeTab, onClick, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${activeTab.toLowerCase() === name.toLowerCase() ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'} ${disabled ? 'text-gray-600 cursor-not-allowed hover:bg-transparent' : ''}`}>
        {name}
    </button>
);

const JsonEditor = ({ value, onChange, placeholder, disabled }) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={disabled ? `Body not applicable for current method` : placeholder} disabled={disabled} className="w-full h-full min-h-[200px] bg-transparent text-gray-300 p-2 font-mono text-sm resize-none focus:outline-none disabled:text-gray-500" />
);

const KeyValueEditor = ({ items, setItems, itemType, hasFileType = false }) => {
    const handleItemChange = (id, field, value) => setItems(items.map(p => p.id === id ? { ...p, [field]: value } : p));
    const handleFileChange = (id, file) => setItems(items.map(p => p.id === id ? { ...p, file: file } : p));
    const addItem = () => {
        const newItem = { id: crypto.randomUUID(), key: '', value: '', enabled: true };
        if (hasFileType) { newItem.type = 'text'; newItem.file = null; }
        setItems([...items, newItem]);
    };
    const removeItem = (id) => setItems(items.filter(p => p.id !== id));

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input type="checkbox" checked={item.enabled} onChange={(e) => handleItemChange(item.id, 'enabled', e.target.checked)} className="col-span-1 form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" />
                    <input type="text" value={item.key} onChange={(e) => handleItemChange(item.id, 'key', e.target.value)} placeholder="Key" className="col-span-3 bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    {hasFileType && item.type === 'file' ? (
                       <input type="file" onChange={(e) => handleFileChange(item.id, e.target.files[0])} className="col-span-5 bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-gray-600 file:text-gray-300 hover:file:bg-gray-500"/>
                    ) : (
                       <input type="text" value={item.value} onChange={(e) => handleItemChange(item.id, 'value', e.target.value)} placeholder="Value" className="col-span-5 bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    )}
                    {hasFileType && (
                        <select value={item.type} onChange={(e) => handleItemChange(item.id, 'type', e.target.value)} className="col-span-2 bg-gray-700/50 border border-gray-600 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"><option>text</option><option>file</option></select>
                    )}
                    <button onClick={() => removeItem(item.id)} className="col-span-1 text-gray-500 hover:text-red-500 transition-colors p-1"><Icon path={ICONS.TRASH} className="w-5 h-5"/></button>
                </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm py-1 px-2 rounded-md hover:bg-cyan-500/10 transition-colors"><Icon path={ICONS.PLUS} className="w-4 h-4"/> Add {itemType}</button>
        </div>
    );
};

const ParamsEditor = ({ params, setParams }) => <KeyValueEditor items={params} setItems={setParams} itemType="Param" />;

const BodyEditor = ({ bodyType, setBodyType, rawBody, setRawBody, formData, setFormData, urlEncoded, setUrlEncoded, disabled }) => (
    <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RadioOption name="bodyType" value="raw" label="Raw (JSON)" checked={bodyType === 'raw'} onChange={setBodyType} disabled={disabled} />
            <RadioOption name="bodyType" value="formData" label="Form-Data" checked={bodyType === 'formData'} onChange={setBodyType} disabled={disabled} />
            <RadioOption name="bodyType" value="urlEncoded" label="x-www-form-urlencoded" checked={bodyType === 'urlEncoded'} onChange={setBodyType} disabled={disabled} />
        </div>
        <div className="flex-grow">
            {bodyType === 'raw' && <JsonEditor value={rawBody} onChange={setRawBody} disabled={disabled} />}
            {bodyType === 'formData' && <KeyValueEditor items={formData} setItems={setFormData} itemType="Field" hasFileType={true}/>}
            {bodyType === 'urlEncoded' && <KeyValueEditor items={urlEncoded} setItems={setUrlEncoded} itemType="Field" />}
        </div>
    </div>
);

const RadioOption = ({ name, value, label, checked, onChange, disabled }) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
        <input type="radio" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="form-radio bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"/>
        <span className={disabled ? 'text-gray-600' : 'text-gray-300'}>{label}</span>
    </label>
);

const AuthEditor = ({ authType, setAuthType, apiKey, setApiKey, bearerToken, setBearerToken, basicUser, setBasicUser, basicPass, setBasicPass }) => {
    return (
        <div className="space-y-4 p-2">
            <div className="flex items-center gap-4">
                <label htmlFor="auth-type" className="font-semibold text-gray-300">Auth Type</label>
                <select id="auth-type" value={authType} onChange={e => setAuthType(e.target.value)} className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="none">None</option><option value="apiKey">API Key</option><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option>
                </select>
            </div>

            {authType === 'apiKey' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Key" value={apiKey.key} onChange={e => setApiKey({...apiKey, key: e.target.value})} placeholder="API Key Name" />
                    <InputField label="Value" value={apiKey.value} onChange={e => setApiKey({...apiKey, value: e.target.value})} placeholder="API Key Value" />
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Add to</label>
                        <select value={apiKey.addTo} onChange={e => setApiKey({...apiKey, addTo: e.target.value})} className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="header">Header</option><option value="query">Query Params</option>
                        </select>
                    </div>
                </div>
            )}

            {authType === 'bearer' && <InputField label="Token" value={bearerToken} onChange={e => setBearerToken(e.target.value)} placeholder="Enter Bearer Token" />}

            {authType === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <InputField label="Username" value={basicUser} onChange={e => setBasicUser(e.target.value)} placeholder="Username" />
                     <InputField label="Password" type="password" value={basicPass} onChange={e => setBasicPass(e.target.value)} placeholder="Password" />
                </div>
            )}
        </div>
    );
};

const InputField = ({ label, type = "text", value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
    </div>
);

