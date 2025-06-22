import { useIsMobile } from '../hooks/useIsMobile';
import UploadPage from './Upload';
import UploadMobilePage from './UploadMobile';

const ResponsiveUpload = () => {
  const isMobile = useIsMobile();

  return isMobile ? <UploadMobilePage /> : <UploadPage />;
};

export default ResponsiveUpload;
