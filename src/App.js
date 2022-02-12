import AceEditor from "react-ace";
import {Fragment, useCallback, useEffect, useMemo, useState} from "react";

// Vendor styles
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

// Styles
import styles from './app.module.css';

// Components
import Files from "./Files/Files";

const scale = 2;

const getLanguageFromFilename = (fileName) => {
    if (fileName.endsWith('.js')) {
        return 'javascript';
    }

    if (fileName.endsWith('.html')) {
        return 'html';
    }
};

const intervals = [];
const oldSetInterval = window.setInterval;
window.setInterval = function(func, callback) {
    const interval = oldSetInterval(func, callback);
    intervals.push(interval);
}

const localFiles = JSON.parse(localStorage.getItem('files') || JSON.stringify([{ name: 'untitled.js', isSelected: true, content: '' }]));
const savedIndex = JSON.parse(localStorage.getItem('currentFileIndex') || '0');

function App() {
    const [files, setFiles] = useState(localFiles);
    const [currentFileIndex, setCurrentFileIndex] = useState(savedIndex);
    const [refreshKey, setRefreshKey] = useState(0);
    const initialFiles = JSON.parse(process.env.REACT_APP_INITIAL_FILES || '[]');

    useEffect(() => {
        const checkFiles = async () => {
            if (initialFiles?.length > 0 && !localStorage.getItem('files')) {
                const newFiles = [];
                for (const [index, initialFile] of initialFiles.entries()) {
                    const module = await import('!!raw-loader!./initial_files/' + initialFile);

                    newFiles.push({
                        name: initialFile,
                        isSelected: initialFiles.length === index + 1,
                        content: module.default,
                    });
                }

                setFiles(newFiles);
                setCurrentFileIndex(initialFiles.length - 1);
            }
        }

        checkFiles();
    }, []);

    const onChange = useCallback((content) => {
        setFiles([
            ...files.map((file, idx) => {
                if (currentFileIndex === idx) {
                    return {
                        ...file,
                        content,
                    };
                }

                return file;
            }),
        ]);
    }, [currentFileIndex, files]);

    const currentFile = useMemo(() => {
        return {
            ...files[currentFileIndex],
            mode: getLanguageFromFilename(files[currentFileIndex].name),
        };
    }, [currentFileIndex, files]);

    const [rawHtmlContent, functions] = useMemo(() => {
        let rawContent = null;
        const functions = [];

        files.forEach((file) => {
            if (file.name === 'index.html') {
                const doc = new DOMParser().parseFromString(file.content, "text/xml");
                doc.querySelectorAll('script').forEach((script) => {
                    const scriptName = script?.attributes?.src?.nodeValue;
                    if (scriptName) {
                        const file = files.find((file) => {
                            return file.name === scriptName;
                        });
                        functions.push(
                            // new Function(file.content)
                            file.content
                        );
                    }
                });
                rawContent = file.content;
            }
        });

        window.isReady = true;
        return [rawContent, functions];
    }, [files]);

    useEffect(() => {
        functions.forEach((f) => {
            const func = new Function(f);
            func();
        });
    }, [refreshKey]);

    useEffect(() => {
        localStorage.setItem('files', JSON.stringify(files));
        localStorage.setItem('currentFileIndex', JSON.stringify(currentFileIndex));
    }, [currentFileIndex, files]);

    const reCalculateFunctions = () => {
        intervals.forEach((interval) => {
            window.clearInterval(interval);
        });
        setRefreshKey(Date.now());
    };

    return (
        <div>
            <div
                className={styles.container}
                style={{
                    width: `${960 * scale}px`,
                    height: `${540 * scale}px`,
                }}
            >
                <div
                    style={{
                        width: '50%',
                        backgroundColor: '#2f3129',
                    }}
                >
                    <Files
                        files={files}
                        onEditName={(newName, index) => {
                            if (newName) {
                                setFiles([
                                    ...files.map((file, idx) => {
                                        if (idx === index) {
                                            return {
                                                ...file,
                                                name: newName,
                                            };
                                        }

                                        return file;
                                    }),
                                ]);
                            }
                        }}
                        onSelectFile={(index) => {
                            if (currentFileIndex !== index) {
                                setCurrentFileIndex(index);
                                setFiles([
                                    ...files.map((file, idx) => {
                                        return {
                                            ...file,
                                            isSelected: idx === index,
                                        };
                                    }),
                                ]);
                            }
                        }}
                        onAddMore={() => {
                            setCurrentFileIndex(files.length);
                            setFiles([
                                ...files.map((file) => {
                                    return {
                                        ...file,
                                        isSelected: false,
                                    };
                                }),
                                { name: `untitled-${files.length}.js`, isSelected: true, content: '' }
                            ]);
                        }}
                    />
                    <AceEditor
                        className={styles.editor}
                        style={{}}
                        width="100%"
                        height="calc(100% - 30px)"
                        mode={currentFile.mode}
                        theme="monokai"
                        name="blah2"
                        onChange={onChange}
                        fontSize={16 * scale}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        value={currentFile.content}
                        // enableBasicAutocompletion={false}
                        // enableLiveAutocompletion={false}
                        setOptions={{
                            behavioursEnabled: false,
                            enableBasicAutocompletion: false,
                            enableLiveAutocompletion: false,
                            enableSnippets: false,
                            showLineNumbers: true,
                            tabSize: 2,
                        }}
                    />
                </div>
                <div
                    style={{
                        width: '50%',
                        border: '2px solid #f3f3f3',
                    }}
                >
                    {rawHtmlContent && (
                        <Fragment>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: rawHtmlContent,
                                }}
                            />
                        </Fragment>
                    )}
                </div>
            </div>
            <button
                data-puppeteer-selector="refresh"
                className="button"
                onClick={reCalculateFunctions}
                style={{
                    marginTop: '20px',
                }}
            >
                Refresh!
            </button>
            <button
                data-puppeteer-selector="refresh-storage"
                className="button"
                onClick={() => localStorage.clear()}
                style={{
                    marginTop: '20px',
                }}
            >
                Clear LocalStorage!
            </button>
        </div>
    );
}

export default App;
