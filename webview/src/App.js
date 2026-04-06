import { useEffect, useState } from 'react';
function App() {
    const [code, setCode] = useState('');
    useEffect(() => {
        // const vscode = acquireVsCodeApi();
        const handler = (event) => {
            const message = event.data;
            if (message.type === 'setCode') {
                console.log("받음:", message.text);
                setCode(message.text);
            }
        };
        window.addEventListener('message', handler);
        return () => {
            window.removeEventListener('message', handler);
        };
    }, []);
    return (<div>
      <h1>NECO Code Helper</h1>
      <pre>{code}</pre>
    </div>);
}
export default App;
//# sourceMappingURL=App.js.map