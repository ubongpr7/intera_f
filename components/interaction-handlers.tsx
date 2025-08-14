"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Slider } from "./ui/slider"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { format } from "date-fns"
import {
  CalendarIcon,
  UploadIcon,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Sliders,
  List,
  CodeIcon,
  ImageIcon,
  AlertTriangle,
  HelpCircle,
} from "lucide-react"

interface InteractionHandlerProps {
  data: any
  onResponse: (response: any) => void
}

export function MultipleChoiceHandler({ data, onResponse }: InteractionHandlerProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [additionalInput, setAdditionalInput] = useState("")

  const handleOptionToggle = (value: string) => {
    if (data.multiple) {
      setSelectedOptions((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
    } else {
      setSelectedOptions([value])
    }
  }

  const handleSubmit = () => {
    onResponse({
      type: "multiple_choice_response",
      selected: data.multiple ? selectedOptions : selectedOptions[0],
      additional_input: additionalInput || null,
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {data.options.map((option: any, index: number) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedOptions.includes(option.value)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleOptionToggle(option.value)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.label}</span>
                {selectedOptions.includes(option.value) && <CheckCircle className="h-4 w-4 text-blue-500" />}
              </div>
              {option.description && <p className="text-sm text-gray-600 mt-1">{option.description}</p>}
            </div>
          ))}
        </div>

        {data.allow_additional_input && (
          <div>
            <label className="block text-sm font-medium mb-2">Additional Instructions (Optional)</label>
            <Textarea
              value={additionalInput}
              onChange={(e) => setAdditionalInput(e.target.value)}
              placeholder="Add any additional context or instructions..."
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} disabled={selectedOptions.length === 0} className="flex-1">
            Submit Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function FileUploadHandler({ data, onResponse }: InteractionHandlerProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)
    const validFiles = fileArray.filter((file) => {
      if (data.accepted_types && data.accepted_types.length > 0) {
        return data.accepted_types.some((type: string) => file.name.toLowerCase().endsWith(type.toLowerCase()))
      }
      return true
    })

    setFiles((prev) => {
      const combined = [...prev, ...validFiles]
      return data.max_files ? combined.slice(0, data.max_files) : combined
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = () => {
    onResponse({
      type: "file_upload_response",
      files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      message: "Files selected for upload",
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-green-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-600 mb-4">
            {data.accepted_types ? `Accepted: ${data.accepted_types.join(", ")}` : "All file types accepted"}
          </p>
          <input
            type="file"
            multiple={data.max_files !== 1}
            accept={data.accepted_types?.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-input"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-input" className="cursor-pointer">
              Browse Files
            </label>
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={files.length === 0} className="w-full">
          Upload {files.length} File{files.length !== 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProgressTrackerHandler({ data, onResponse }: InteractionHandlerProps) {
  const handleCancel = () => {
    onResponse({
      type: "progress_response",
      action: "cancel",
      message: "Operation cancelled by user",
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{data.current_step || "Processing..."}</span>
            <span>
              {data.current}/{data.total}
            </span>
          </div>
          <Progress value={(data.current / data.total) * 100} className="w-full" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{Math.round((data.current / data.total) * 100)}% complete</span>
            {data.estimated_time && <span>~{data.estimated_time} remaining</span>}
          </div>
        </div>

        {data.allow_cancel && (
          <Button variant="outline" onClick={handleCancel} className="w-full bg-transparent">
            Cancel Operation
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function DataTableHandler({ data, onResponse }: InteractionHandlerProps) {
  const [tableData, setTableData] = useState(data.rows)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData]
    newData[rowIndex][colIndex] = value
    setTableData(newData)
    setEditingCell(null)
  }

  const handleSubmit = (action: "approve" | "reject") => {
    onResponse({
      type: "data_table_response",
      action,
      data: action === "approve" ? tableData : data.rows,
      message: `Data ${action}d by user`,
    })
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                {data.headers.map((header: string, index: number) => (
                  <th key={index} className="border border-gray-300 p-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: any, colIndex: number) => (
                    <td key={colIndex} className="border border-gray-300 p-2">
                      {data.editable_columns?.includes(colIndex) ? (
                        editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                          <Input
                            value={cell}
                            onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingCell(null)}
                            autoFocus
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                          >
                            {cell}
                          </div>
                        )
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleSubmit("approve")} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Changes
          </Button>
          <Button variant="outline" onClick={() => handleSubmit("reject")} className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Reject Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DynamicFormHandler({ data, onResponse }: InteractionHandlerProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleSubmit = () => {
    onResponse({
      type: "form_response",
      data: formData,
      message: "Form submitted successfully",
    })
  }

  const updateField = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.fields.map((field: any, index: number) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "text" && (
              <Input
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === "textarea" && (
              <Textarea
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            )}

            {field.type === "number" && (
              <Input
                type="number"
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, Number.parseFloat(e.target.value))}
                placeholder={field.placeholder}
                required={field.required}
                min={field.min}
                max={field.max}
              />
            )}

            {field.type === "select" && (
              <select
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required={field.required}
              >
                <option value="">Select an option</option>
                {field.options?.map((option: any, optIndex: number) => (
                  <option key={optIndex} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <Button onClick={handleSubmit} className="w-full">
          Submit Form
        </Button>
      </CardContent>
    </Card>
  )
}

export function DateTimePickerHandler({ data, onResponse }: InteractionHandlerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")

  const handleSubmit = () => {
    let result = selectedDate
    if (data.type === "datetime" && selectedTime) {
      const [hours, minutes] = selectedTime.split(":")
      result = new Date(selectedDate!)
      result.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    }

    onResponse({
      type: "datetime_response",
      selected_date: result?.toISOString(),
      message: `Selected: ${result?.toLocaleString()}`,
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-green-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
          </PopoverContent>
        </Popover>

        {data.type === "datetime" && (
          <Input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full"
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedDate || (data.type === "datetime" && !selectedTime)}
          className="w-full"
        >
          Confirm Selection
        </Button>
      </CardContent>
    </Card>
  )
}

export function SliderInputHandler({ data, onResponse }: InteractionHandlerProps) {
  const [value, setValue] = useState([data.default_value || data.min])

  const handleSubmit = () => {
    onResponse({
      type: "slider_response",
      value: value[0],
      message: `Selected value: ${value[0]}${data.unit || ""}`,
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-orange-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {data.min}
              {data.unit}
            </span>
            <span className="font-medium text-lg">
              {value[0]}
              {data.unit}
            </span>
            <span>
              {data.max}
              {data.unit}
            </span>
          </div>
          <Slider
            value={value}
            onValueChange={setValue}
            min={data.min}
            max={data.max}
            step={data.step || 1}
            className="w-full"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Confirm Value
        </Button>
      </CardContent>
    </Card>
  )
}

export function PriorityRankingHandler({ data, onResponse }: InteractionHandlerProps) {
  const [items, setItems] = useState(data.items)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newItems = [...items]
    const draggedItemData = newItems[draggedItem]
    newItems.splice(draggedItem, 1)
    newItems.splice(index, 0, draggedItemData)

    setItems(newItems)
    setDraggedItem(index)
  }

  const handleSubmit = () => {
    onResponse({
      type: "ranking_response",
      ranked_items: items.map((item: any, index: number) => ({
        ...item,
        rank: index + 1,
      })),
      message: "Items ranked successfully",
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-red-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-gray-50"
            >
              <Badge variant="outline" className="min-w-[2rem] justify-center">
                {index + 1}
              </Badge>
              <span className="flex-1">{item.label}</span>
              <div className="text-gray-400">⋮⋮</div>
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Submit Ranking
        </Button>
      </CardContent>
    </Card>
  )
}

export function CodeReviewHandler({ data, onResponse }: InteractionHandlerProps) {
  const [comments, setComments] = useState<Record<string, string>>({})

  const handleSubmit = (action: "approve" | "reject" | "request_changes") => {
    onResponse({
      type: "code_review_response",
      action,
      comments,
      message: `Code review ${action}d`,
    })
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CodeIcon className="h-5 w-5 text-blue-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.changes.map((change: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{change.file}</h4>
              <Badge variant={change.change_type === "addition" ? "default" : "secondary"}>{change.change_type}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {change.old_code && (
                <div>
                  <h5 className="text-sm font-medium text-red-600 mb-2">Before:</h5>
                  <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
                    <code>{change.old_code}</code>
                  </pre>
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-green-600 mb-2">After:</h5>
                <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                  <code>{change.new_code}</code>
                </pre>
              </div>
            </div>

            <Textarea
              placeholder="Add comments for this change..."
              value={comments[change.file] || ""}
              onChange={(e) => setComments((prev) => ({ ...prev, [change.file]: e.target.value }))}
              rows={2}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Button onClick={() => handleSubmit("approve")} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button variant="outline" onClick={() => handleSubmit("request_changes")} className="flex-1">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button variant="destructive" onClick={() => handleSubmit("reject")} className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ImageAnnotationHandler({ data, onResponse }: InteractionHandlerProps) {
  const [annotations, setAnnotations] = useState<any[]>([])
  const [selectedTool, setSelectedTool] = useState(data.tools[0])

  const handleSubmit = () => {
    onResponse({
      type: "image_annotation_response",
      annotations,
      message: `Added ${annotations.length} annotations`,
    })
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-pink-500" />
          <CardTitle>{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {data.tools.map((tool: string) => (
            <Button
              key={tool}
              variant={selectedTool === tool ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool(tool)}
            >
              {tool}
            </Button>
          ))}
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Image annotation interface would be implemented here</p>
            <p className="text-sm">Selected tool: {selectedTool}</p>
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Submit Annotations ({annotations.length})
        </Button>
      </CardContent>
    </Card>
  )
}
