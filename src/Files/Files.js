import classNames from "classnames";

import styles from './files.module.css';

function Files({
    files = [],
    onAddMore,
    onEditName,
    onSelectFile,
}) {
    return (
        <ul className={styles['list-wrapper']}>
            {files.map((file, index) => {
                return (
                    <li
                        data-puppeteer-selector={file.name}
                        key={file.name}
                        onBlur={(event) => {
                            const element = event.target;
                            element.contentEditable = false;
                            onEditName(event?.currentTarget?.textContent, index);
                        }}
                        // contentEditable={true}
                        onClick={(event) => {
                            const element = event.target;
                            element.contentEditable = true;
                            setTimeout(function() {
                                if (document.activeElement !== element) {
                                    element.contentEditable = false;
                                    onSelectFile(index);
                                }
                            }, 300);
                        }}
                        spellCheck={false}
                        className={classNames(styles['list-item'], {
                            [styles['selected-list-item']]: file.isSelected,
                        })}
                    >
                        {file.name}
                    </li>
                );
            })}
            <li
                key="add-more"
                data-puppeteer-selector="add-new-file"
                className={styles['list-item']}
                onClick={onAddMore}
            >
                +
            </li>
        </ul>
    );
}

export default Files;
