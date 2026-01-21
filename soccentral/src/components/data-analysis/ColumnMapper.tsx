import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Star, Clock, Hash, BarChart3 } from 'lucide-react';
import { ColumnInfo, DataFile } from '@/types/dataAnalysis';

interface ColumnMapperProps {
  file: DataFile;
  onColumnsSelected: (selectedColumns: string[]) => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ file, onColumnsSelected }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    file.columnInfo
      .filter(col => col.relevanceScore > 50)
      .map(col => col.name)
  );
  
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'type'>('relevance');

  const sortedColumns = [...file.columnInfo].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return b.relevanceScore - a.relevanceScore;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const handleColumnToggle = (columnName: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedColumns, columnName]
      : selectedColumns.filter(name => name !== columnName);
    
    setSelectedColumns(newSelection);
  };

  const selectHighRelevance = () => {
    const highRelevanceColumns = file.columnInfo
      .filter(col => col.relevanceScore > 70)
      .map(col => col.name);
    setSelectedColumns(highRelevanceColumns);
  };

  const selectByType = (type: string) => {
    const typeColumns = file.columnInfo
      .filter(col => col.type === type)
      .map(col => col.name);
    setSelectedColumns([...new Set([...selectedColumns, ...typeColumns])]);
  };

  const getColumnIcon = (column: ColumnInfo) => {
    if (column.isTimestamp) return <Clock className="h-4 w-4 text-blue-500" />;
    if (column.isIdentifier) return <Hash className="h-4 w-4 text-purple-500" />;
    if (column.isMetric) return <BarChart3 className="h-4 w-4 text-green-500" />;
    return null;
  };

  const getRelevanceBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (score >= 50) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Intelligent Column Mapping
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered column analysis for {file.name} ({file.rowCount.toLocaleString()} rows)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={selectHighRelevance}>
            <Star className="h-4 w-4 mr-1" />
            Select High Relevance
          </Button>
          <Button size="sm" variant="outline" onClick={() => selectByType('date')}>
            <Clock className="h-4 w-4 mr-1" />
            Add Timestamps
          </Button>
          <Button size="sm" variant="outline" onClick={() => selectByType('number')}>
            <BarChart3 className="h-4 w-4 mr-1" />
            Add Metrics
          </Button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Column List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedColumns.map(column => (
            <div 
              key={column.name}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedColumns.includes(column.name)}
                  onCheckedChange={(checked) => handleColumnToggle(column.name, !!checked)}
                />
                
                <div className="flex items-center gap-2">
                  {getColumnIcon(column)}
                  <div>
                    <div className="font-medium">{column.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {column.type} • {column.sampleValues.slice(0, 2).join(', ')}
                      {column.sampleValues.length > 2 && '...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getRelevanceBadge(column.relevanceScore)}
                <span className="text-xs text-muted-foreground">
                  {Math.round(column.relevanceScore)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedColumns.length} of {file.columnInfo.length} columns selected
          </span>
          <Button 
            onClick={() => onColumnsSelected(selectedColumns)}
            disabled={selectedColumns.length === 0}
          >
            Proceed with Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};