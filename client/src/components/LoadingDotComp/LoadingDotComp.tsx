import styles from './LoadingDotComp.module.css';

export interface LoadingDotCompProps {
  requestsInFlight: number;
  className?: string;
}

export const LoadingDotComp = ({ requestsInFlight, className }: LoadingDotCompProps) => {
  return <div title={`${requestsInFlight === 0 ? 'Search results fetched' : 'Loading'}`}
              className={`${styles.dot} ${requestsInFlight === 0 ? styles.loaded : styles.loading} ${className}`}></div>;
};
