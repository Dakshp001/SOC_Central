import { 
  AllToolData, 
  SIEMData, 
  GSuiteData, 
  MDMData, 
  EDRData, 
  MerakiData,
  SonicWallData,
  EnhancedMerakiData,
  isEnhancedGSuiteData,
  isAnyGSuiteData,
  isEnhancedMerakiData,
  isAnyMerakiData
} from '@/lib/api';

export const isSIEMData = (data: AllToolData): data is SIEMData => {
  return data && typeof data === 'object' && 'fileType' in data && data.fileType === 'siem';
};

export const isGSuiteData = (data: AllToolData): data is GSuiteData => {
  return isAnyGSuiteData(data);
};

export const isMDMData = (data: AllToolData): data is MDMData => {
  return !!(data && 
    typeof data === 'object' && 
    'kpis' in data && 
    data.kpis &&
    typeof data.kpis === 'object' &&
    'analytics' in data && 
    'complianceRate' in data.kpis);
};

export const isEDRData = (data: AllToolData): data is EDRData => {
  return !!(data && 
    typeof data === 'object' && 
    'fileType' in data && 
    data.fileType === 'edr' &&
    'kpis' in data &&
    data.kpis &&
    typeof data.kpis.totalEndpoints === 'number' &&
    typeof data.kpis.securityScore === 'number');
};

export const isMerakiData = (data: AllToolData): data is EnhancedMerakiData | MerakiData => {
  return isAnyMerakiData(data);
};

export const isEnhancedMeraki = (data: AllToolData): data is EnhancedMerakiData => {
  return isEnhancedMerakiData(data);
};

export const isSonicWallData = (data: AllToolData): data is SonicWallData => {
  return data && typeof data === 'object' && 'fileType' in data && data.fileType === 'sonicwall';
};