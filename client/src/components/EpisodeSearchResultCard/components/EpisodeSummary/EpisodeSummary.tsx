import {useState} from "react";

import styles from './EpisodeSummary.module.css';

export interface EpisodeSummaryProps {
    episodeSummary: string;
}

export const EpisodeSummary = ({episodeSummary}: EpisodeSummaryProps) => {
    const [showAll, setShowAll] = useState(false);

    return <div>
        <h4>Summary</h4>

        {showAll ? episodeSummary : (
            <div>
                <span>{episodeSummary.slice(0, 350)}...</span>
                <button className={styles.moreBtn} onClick={() => {
                    setShowAll(true);
                }}>more
                </button>
            </div>
        )}
    </div>
}
