"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Bell,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"

interface ExtraCollabProps {
  data: any
  onResponse: (response: any) => void
  compact?: boolean
  disabled?: boolean
}

export function DashboardBuilderHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([])
  const [layout, setLayout] = useState(data.current_layout || [])

  const handleAddWidget = (widgetType: string) => {
    if (!selectedWidgets.includes(widgetType)) {
      setSelectedWidgets([...selectedWidgets, widgetType])
    }
  }

  const handleSave = () => {
    onResponse({
      type: "dashboard_builder_response",
      selected_widgets: selectedWidgets,
      layout: layout,
    })
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <BarChart3 className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-4">
          <div>
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Available Widgets</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.available_widgets.map((widget: any, index: number) => (
                <Button
                  key={index}
                  variant={selectedWidgets.includes(widget.type) ? "default" : "outline"}
                  size={compact ? "sm" : "default"}
                  onClick={() => handleAddWidget(widget.type)}
                  className="justify-start"
                >
                  {widget.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Selected Widgets</h4>
            <div className="space-y-1">
              {selectedWidgets.map((widget, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className={compact ? "text-xs" : "text-sm"}>{widget}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWidgets(selectedWidgets.filter((w) => w !== widget))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" size={compact ? "sm" : "default"}>
            Save Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


export function MasterDetailTableHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const handleRowSelect = (rowId: string) => {
    setSelectedRows((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]))
  }

  const handleSubmit = () => {
    onResponse({
      type: "master_detail_response",
      selected_rows: selectedRows,
      expanded_rows: Array.from(expandedRows),
    })
  }

  // Improved nested value accessor
  const getNestedValue = (obj: any, keyPath: string) => {
    if (!keyPath || !obj) return "N/A"
    
    try {
      const result = keyPath.split('.').reduce((current, key) => {
        if (current === null || current === undefined) return undefined
        return current[key]
      }, obj)
      
      // Return actual value even if it's falsy (0, false, empty string)
      return result === undefined || result === null ? "N/A" : result
    } catch (e) {
      return "N/A"
    }
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <BarChart3 className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-2">
          {data.master_data.map((row: any, index: number) => (
            <div key={row.id || index} className="border rounded-lg">
              <div className="flex items-center p-3 bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleRowSelect(row.id)}
                  className="mr-3"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleRow(row.id)} 
                  className="mr-2 p-0"
                >
                  {expandedRows.has(row.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 grid grid-cols-4 gap-4">
                  {data.master_columns.map((col: any) => (
                    <div key={col.id}>
                      <div className={`text-xs text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>
                        {col.name} {/* Changed from col.label */}
                      </div>
                      <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                        {getNestedValue(row, col.id)} {/* Changed from col.name to col.id */}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {expandedRows.has(row.id) && row[data.detail_key] && (
                <div className="p-3 border-t">
                  <div className="space-y-2">
                    {row[data.detail_key].map((detail: any, detailIndex: number) => (
                      <div 
                        key={detailIndex} 
                        className="grid grid-cols-3 gap-4 p-2 bg-white rounded border"
                      >
                        {data.detail_columns.map((col: any) => (
                          <div key={col.id}>
                            <span className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>
                              {col.name}: {getNestedValue(detail, col.id)} {/* Changed from col.name to col.id */}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedRows.length > 0 && (
          <Button onClick={handleSubmit} className="w-full mt-4" size={compact ? "sm" : "default"}>
            Process Selected ({selectedRows.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
export function AlertManagerHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [newAlert, setNewAlert] = useState({
    trigger: "",
    action: "",
    condition: "",
    value: "",
  })

  const handleCreateAlert = () => {
    onResponse({
      type: "alert_manager_response",
      action: "create",
      alert: newAlert,
    })
  }

  const handleDeleteAlert = (alertId: string) => {
    onResponse({
      type: "alert_manager_response",
      action: "delete",
      alert_id: alertId,
    })
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <Bell className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-4">
          <div className="p-3 border rounded-lg">
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Create New Alert</h4>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newAlert.trigger}
                onChange={(e) => setNewAlert({ ...newAlert, trigger: e.target.value })}
                className={`border rounded px-2 py-1 ${compact ? "text-xs" : "text-sm"}`}
              >
                <option value="">Select Trigger</option>
                {data.available_triggers.map((trigger: any, index: number) => (
                  <option key={index} value={trigger.id}>
                    {trigger.name}
                  </option>
                ))}
              </select>
              <select
                value={newAlert.action}
                onChange={(e) => setNewAlert({ ...newAlert, action: e.target.value })}
                className={`border rounded px-2 py-1 ${compact ? "text-xs" : "text-sm"}`}
              >
                <option value="">Select Action</option>
                {data.available_actions.map((action: any, index: number) => (
                  <option key={index} value={action.id}>
                    {action.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Condition"
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                size={compact ? "sm" : "default"}
              />
              <Input
                placeholder="Value"
                value={newAlert.value}
                onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                size={compact ? "sm" : "default"}
              />
            </div>
            <Button onClick={handleCreateAlert} className="w-full mt-2" size={compact ? "sm" : "default"}>
              Create Alert
            </Button>
          </div>

          <div>
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Existing Alerts</h4>
            <div className="space-y-2">
              {data.existing_alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{alert.name}</span>
                    <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{alert.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAlert(alert.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskAssignmentHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [assignment, setAssignment] = useState({
    assignee: "",
    priority: "Medium",
    due_date: "",
    notes: "",
  })

  const handleAssign = () => {
    onResponse({
      type: "task_assignment_response",
      task_id: data.task_details.id,
      assignment: assignment,
    })
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <Users className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <h4 className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>Task Details</h4>
            <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.task_details.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>Assign To</label>
              <select
                value={assignment.assignee}
                onChange={(e) => setAssignment({ ...assignment, assignee: e.target.value })}
                className={`w-full border rounded px-2 py-1 ${compact ? "text-xs" : "text-sm"}`}
              >
                <option value="">Select Assignee</option>
                {data.available_assignees.map((user: any, index: number) => (
                  <option key={index} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>Priority</label>
              <select
                value={assignment.priority}
                onChange={(e) => setAssignment({ ...assignment, priority: e.target.value })}
                className={`w-full border rounded px-2 py-1 ${compact ? "text-xs" : "text-sm"}`}
              >
                {data.priority_levels.map((level: string, index: number) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {data.due_date_required && (
            <div>
              <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>Due Date</label>
              <Input
                type="datetime-local"
                value={assignment.due_date}
                onChange={(e) => setAssignment({ ...assignment, due_date: e.target.value })}
                size={compact ? "sm" : "default"}
              />
            </div>
          )}

          <div>
            <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>Additional Notes</label>
            <Textarea
              value={assignment.notes}
              onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
              placeholder="Add any additional instructions..."
              className={compact ? "text-xs" : "text-sm"}
              rows={compact ? 2 : 3}
            />
          </div>

          <Button onClick={handleAssign} className="w-full" size={compact ? "sm" : "default"}>
            Assign Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function CommentThreadHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [newComment, setNewComment] = useState("")

  const handleAddComment = () => {
    if (newComment.trim()) {
      onResponse({
        type: "comment_thread_response",
        action: "add_comment",
        comment: newComment,
        context_id: data.context_object.id,
      })
      setNewComment("")
    }
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <MessageSquare className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>
              {data.context_object.type}: {data.context_object.name}
            </h4>
            <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.context_object.description}</p>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {data.existing_comments.map((comment: any, index: number) => (
              <div key={index} className="p-2 border rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{comment.author}</span>
                  <span className={`text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>{comment.timestamp}</span>
                </div>
                <p className={`text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>{comment.content}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className={compact ? "text-xs" : "text-sm"}
              rows={compact ? 2 : 3}
            />
            <Button onClick={handleAddComment} size={compact ? "sm" : "default"}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ApprovalWorkflowHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [decision, setDecision] = useState("")
  const [comments, setComments] = useState("")

  const handleApproval = (approved: boolean) => {
    onResponse({
      type: "approval_workflow_response",
      approved: approved,
      step: data.current_step,
      comments: comments,
      workflow_id: data.workflow_item.id,
    })
  }

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <CheckCircle className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded">
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>
              {data.workflow_item.type}: {data.workflow_item.title}
            </h4>
            <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.workflow_item.description}</p>
          </div>

          <div>
            <h4 className={`font-medium mb-2 ${compact ? "text-xs" : "text-sm"}`}>Approval Progress</h4>
            <div className="flex items-center space-x-2">
              {data.approval_steps.map((step: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < data.current_step
                        ? "bg-green-500 text-white"
                        : index === data.current_step
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index < data.current_step ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : index === data.current_step ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  {index < data.approval_steps.length - 1 && (
                    <div className={`w-8 h-1 ${index < data.current_step ? "bg-green-500" : "bg-gray-300"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {data.allow_comments && (
            <div>
              <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>Comments</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add approval comments..."
                className={compact ? "text-xs" : "text-sm"}
                rows={compact ? 2 : 3}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleApproval(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size={compact ? "sm" : "default"}
            >
              Approve
            </Button>
            <Button
              onClick={() => handleApproval(false)}
              variant="destructive"
              className="flex-1"
              size={compact ? "sm" : "default"}
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function WizardFlowHandler({ data, onResponse, compact = false, disabled = false }: ExtraCollabProps) {
  const [currentStep, setCurrentStep] = useState(data.current_step || 0)
  const [responses, setResponses] = useState<Record<string, any>>(data.existing_responses || {})
  const [currentStepData, setCurrentStepData] = useState<Record<string, any>>({})

  const handleFieldChange = (fieldName: string, value: any) => {
    setCurrentStepData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleNext = () => {
    // Save current step data
    const updatedResponses = {
      ...responses,
      [`step_${currentStep}`]: currentStepData,
    }
    setResponses(updatedResponses)

    if (currentStep < data.steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setCurrentStepData({})
    } else {
      // Final step - submit all responses
      onResponse({
        type: "wizard_flow_response",
        completed: true,
        all_responses: updatedResponses,
        final_step_data: currentStepData,
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      // Load previous step data
      setCurrentStepData(responses[`step_${currentStep - 1}`] || {})
    }
  }

  const handleSkip = () => {
    onResponse({
      type: "wizard_flow_response",
      skipped: true,
      current_step: currentStep,
      partial_responses: responses,
    })
  }

  const currentStepInfo = data.steps[currentStep]
  const isLastStep = currentStep === data.steps.length - 1

  return (
    <Card className={`${compact ? "text-sm" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
          <CheckCircle className={compact ? "h-4 w-4" : "h-5 w-5"} />
          {data.title}
        </CardTitle>
        <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>{data.description}</p>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {data.steps.map((_: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      index < currentStep
                        ? "bg-green-500 text-white"
                        : index === currentStep
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  {index < data.steps.length - 1 && (
                    <div className={`w-4 h-0.5 ${index < currentStep ? "bg-green-500" : "bg-gray-300"}`} />
                  )}
                </div>
              ))}
            </div>
            <span className={`text-xs text-gray-500 ${compact ? "text-xs" : "text-sm"}`}>
              Step {currentStep + 1} of {data.steps.length}
            </span>
          </div>

          {/* Current step content */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className={`font-medium mb-2 ${compact ? "text-sm" : "text-base"}`}>{currentStepInfo.title}</h3>
            <p className={`text-gray-600 mb-4 ${compact ? "text-xs" : "text-sm"}`}>{currentStepInfo.description}</p>

            {/* Render step fields */}
            <div className="space-y-3">
              {currentStepInfo.fields.map((field: any, index: number) => (
                <div key={index}>
                  {field.type !== "checkbox" && field.type !== "boolean" && (
                    <label className={`block font-medium mb-1 ${compact ? "text-xs" : "text-sm"}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}

                  {field.type === "text" && (
                    <Input
                      value={currentStepData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      size={compact ? "sm" : "default"}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      value={currentStepData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={compact ? 2 : 3}
                      className={compact ? "text-xs" : "text-sm"}
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      value={currentStepData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={`w-full border rounded px-3 py-2 ${compact ? "text-xs" : "text-sm"}`}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option: any, optIndex: number) => (
                        <option key={optIndex} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {(field.type === "checkbox" || field.type === "boolean") && (
                    <div className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                      <input
                        type="checkbox"
                        id={`field-${field.name}`}
                        checked={currentStepData[field.name] || false}
                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label
                        htmlFor={`field-${field.name}`}
                        className={`font-medium cursor-pointer ${compact ? "text-xs" : "text-sm"}`}
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button onClick={handlePrevious} variant="outline" size={compact ? "sm" : "default"}>
                  Previous
                </Button>
              )}
              {data.allow_skip && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size={compact ? "sm" : "default"}
                  className="text-gray-500"
                >
                  Skip Wizard
                </Button>
              )}
            </div>

            <Button onClick={handleNext} size={compact ? "sm" : "default"} className="bg-blue-600 hover:bg-blue-700">
              {isLastStep ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
