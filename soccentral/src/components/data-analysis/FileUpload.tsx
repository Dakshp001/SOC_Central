import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { ToolType, DataFile } from '@/types/dataAnalysis';
import { useToast } from '@/hooks/use-toast';
// import * as XLSX from 'xlsx'; // Temporarily disabled due to security vulnerability
import Papa from 'papaparse';

interface FileUploadProps {
  onFileProcessed: (file: DataFile) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>('SIEM');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File, tool: ToolType) => {
    setUploading(true);
    setProgress(0);

    try {
      const dataFile: DataFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        tool,
        columnInfo: [],
        rowCount: 0,
        status: 'processing'
      };

      setProgress(25);

      // Read file content
      const content = await file.arrayBuffer();
      setProgress(50);

      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = new TextDecoder().decode(content);
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = parsed.data as any[];
        headers = parsed.meta.fields || [];
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel support temporarily disabled due to security vulnerability in xlsx library
        throw new Error('Excel file support is temporarily unavailable due to security concerns. Please convert your file to CSV format.');
      }

      setProgress(75);

      // Analyze columns
      const columnInfo = headers.map(header => {
        const sampleValues = data.slice(0, 5).map(row => row[header]).filter(val => val != null);
        const type = detectColumnType(sampleValues);
        
        return {
          name: header,
          type,
          isIdentifier: isIdentifierColumn(header, sampleValues),
          isTimestamp: isTimestampColumn(header, type),
          isMetric: isMetricColumn(header, type),
          relevanceScore: calculateRelevanceScore(header, type, sampleValues),
          sampleValues
        };
      });

      dataFile.columnInfo = columnInfo;
      dataFile.rowCount = data.length;
      dataFile.status = 'ready';

      setProgress(100);

      toast({
        title: "File processed successfully",
        description: `Processed ${data.length} records with ${headers.length} columns`,
      });

      onFileProcessed(dataFile);

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "Please check the file format and try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onFileProcessed, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0], selectedTool);
    }
  }, [processFile, selectedTool]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Tool</label>
          <Select value={selectedTool} onValueChange={(value) => setSelectedTool(value as ToolType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SIEM">SIEM</SelectItem>
              <SelectItem value="EDR">EDR</SelectItem>
              <SelectItem value="MDM">MDM</SelectItem>
              <SelectItem value="Meraki">Meraki</SelectItem>
              <SelectItem value="G-Suite">G-Suite</SelectItem>
              <SelectItem value="SonicWall">SonicWall</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm">Drop the file here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag & drop a CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .csv files up to 100MB (Excel support temporarily disabled for security)
              </p>
            </div>
          )}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing file...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions for column analysis
function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  if (values.length === 0) return 'string';
  
  const nonNullValues = values.filter(v => v != null && v !== '');
  if (nonNullValues.length === 0) return 'string';
  
  // Check for dates
  const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(v))).length;
  if (dateCount / nonNullValues.length > 0.8) return 'date';
  
  // Check for numbers
  const numberCount = nonNullValues.filter(v => !isNaN(parseFloat(v))).length;
  if (numberCount / nonNullValues.length > 0.8) return 'number';
  
  // Check for booleans
  const boolCount = nonNullValues.filter(v => 
    ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
  ).length;
  if (boolCount / nonNullValues.length > 0.8) return 'boolean';
  
  return 'string';
}

function isIdentifierColumn(name: string, values: any[]): boolean {
  const idKeywords = ['id', 'identifier', 'uuid', 'key', 'serial', 'imei'];
  const nameCheck = idKeywords.some(keyword => name.toLowerCase().includes(keyword));
  
  // Check for uniqueness
  const unique = new Set(values).size;
  const uniqueness = unique / values.length;
  
  return nameCheck || uniqueness > 0.9;
}

function isTimestampColumn(name: string, type: string): boolean {
  const timeKeywords = ['time', 'date', 'timestamp', 'created', 'updated', 'seen'];
  return type === 'date' || timeKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function isMetricColumn(name: string, type: string): boolean {
  const metricKeywords = ['count', 'total', 'sum', 'avg', 'rate', 'score', 'percent'];
  return type === 'number' && metricKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function calculateRelevanceScore(name: string, type: string, values: any[]): number {
  let score = 0;
  
  // Base score by type
  if (type === 'date') score += 30;
  else if (type === 'number') score += 20;
  else if (type === 'string') score += 10;
  
  // Boost for important keywords
  const importantKeywords = [
    'time', 'date', 'id', 'status', 'type', 'level', 'severity', 
    'source', 'destination', 'user', 'device', 'platform'
  ];
  
  if (importantKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    score += 25;
  }
  
  // Penalize for empty values
  const emptyCount = values.filter(v => v == null || v === '').length;
  const completeness = 1 - (emptyCount / values.length);
  score *= completeness;
  
  return Math.min(100, Math.max(0, score));
}