// app/features/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FeatureTracker() {
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: "Core Inventory Management",
      progress: 85,
      tasks: [
        {
          id: 1,
          title: "Product Management",
          progress: 100,
          subtasks: [
            { id: 1, title: "Add/Edit Products", completed: true },
            { id: 2, title: "Category Organization", completed: true },
            { id: 3, title: "Variant Management", completed: true },
          ]
        },
        {
          id: 2,
          title: "Inventory Tracking",
          progress: 75,
          subtasks: [
            { id: 1, title: "Real-time Stock Updates", completed: true },
            { id: 2, title: "Low Stock Alerts", completed: true },
            { id: 3, title: "Multi-location Sync", completed: false },
            { id: 4, title: "Stock Reconciliation", completed: true },
          ]
        },
        {
          id: 3,
          title: "Reporting & Analytics",
          progress: 60,
          subtasks: [
            { id: 1, title: "Sales Reports", completed: true },
            { id: 2, title: "Inventory Valuation", completed: false },
            { id: 3, title: "Profit Margin Analysis", completed: false },
          ]
        }
      ]
    },
    {
      id: 2,
      title: "Offline-First POS System",
      progress: 40,
      tasks: [
        {
          id: 1,
          title: "Transaction Processing",
          progress: 65,
          subtasks: [
            { id: 1, title: "Offline Sales Capture", completed: true },
            { id: 2, title: "Payment Processing", completed: false },
            { id: 3, title: "Receipt Generation", completed: true },
          ]
        },
        {
          id: 2,
          title: "Data Sync Engine",
          progress: 20,
          subtasks: [
            { id: 1, title: "Conflict Resolution", completed: false },
            { id: 2, title: "Background Sync", completed: false },
            { id: 3, title: "Sync Status Monitoring", completed: false },
          ]
        }
      ]
    },
    {
      id: 3,
      title: "AI-Powered Features",
      progress: 15,
      tasks: [
        {
          id: 1,
          title: "Demand Forecasting",
          progress: 30,
          subtasks: [
            { id: 1, title: "Historical Data Analysis", completed: true },
            { id: 2, title: "ML Prediction Models", completed: false },
            { id: 3, title: "Seasonality Adjustments", completed: false },
          ]
        },
        {
          id: 2,
          title: "Automated Reordering",
          progress: 0,
          subtasks: [
            { id: 1, title: "Supplier Integration", completed: false },
            { id: 2, title: "Smart Reorder Points", completed: false },
          ]
        }
      ]
    },
    {
      id: 4,
      title: "Admin & Security",
      progress: 25,
      tasks: [
        {
          id: 1,
          title: "User Management",
          progress: 50,
          subtasks: [
            { id: 1, title: "Role-Based Access", completed: true },
            { id: 2, title: "Permission Levels", completed: false },
            { id: 3, title: "Audit Logs", completed: false },
          ]
        }
      ]
    }
  ]);

  const [newSubtask, setNewSubtask] = useState("");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: ""
  });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  // Calculate overall progress
  const overallProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0) / milestones.length;

  const toggleSubtask = (milestoneId: number, taskId: number, subtaskId: number) => {
    setMilestones(prev => 
      prev.map(milestone => {
        if (milestone.id === milestoneId) {
          const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId) {
              const updatedSubtasks = task.subtasks.map(subtask => 
                subtask.id === subtaskId 
                  ? { ...subtask, completed: !subtask.completed } 
                  : subtask
              );
              
              // Calculate task progress
              const completedCount = updatedSubtasks.filter(st => st.completed).length;
              const progress = updatedSubtasks.length > 0 
                ? Math.round((completedCount / updatedSubtasks.length) * 100) 
                : 0;
              
              return { ...task, subtasks: updatedSubtasks, progress };
            }
            return task;
          });
          
          // Calculate milestone progress
          const totalProgress = updatedTasks.reduce((sum, task) => sum + task.progress, 0);
          const progress = updatedTasks.length > 0 
            ? Math.round(totalProgress / updatedTasks.length) 
            : 0;
            
          return { ...milestone, tasks: updatedTasks, progress };
        }
        return milestone;
      })
    );
  };

  const addSubtask = (milestoneId: number, taskId: number) => {
    if (!newSubtask.trim()) return;
    
    setMilestones(prev => 
      prev.map(milestone => {
        if (milestone.id === milestoneId) {
          const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId) {
              const newId = task.subtasks.length > 0 
                ? Math.max(...task.subtasks.map(st => st.id)) + 1 
                : 1;
              
              return {
                ...task,
                subtasks: [
                  ...task.subtasks,
                  { id: newId, title: newSubtask, completed: false }
                ]
              };
            }
            return task;
          });
          return { ...milestone, tasks: updatedTasks };
        }
        return milestone;
      })
    );
    
    setNewSubtask("");
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    
    const newId = milestones.length > 0 
      ? Math.max(...milestones.map(m => m.id)) + 1 
      : 1;
    
    setMilestones(prev => [
      ...prev,
      {
        id: newId,
        title: newMilestone.title,
        description: newMilestone.description,
        progress: 0,
        tasks: []
      }
    ]);
    
    setNewMilestone({ title: "", description: "" });
    setShowMilestoneForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Intera Development Tracker</h1>
              <p className="text-gray-600 mt-2">Track your progress toward shipping the perfect inventory management system</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="text-lg font-bold text-gray-900">{Math.round(overallProgress)}%</div>
                  <div className="text-sm text-gray-500">Overall Progress</div>
                </div>
                <div className="relative w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{milestones.length}</div>
                <div className="text-sm text-gray-600">Milestones</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {milestones.flatMap(m => m.tasks).length}
                </div>
                <div className="text-sm text-gray-600">Tasks</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {milestones.flatMap(m => m.tasks.flatMap(t => t.subtasks)).length}
                </div>
                <div className="text-sm text-gray-600">Subtasks</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {milestones.flatMap(m => m.tasks.flatMap(t => t.subtasks.filter(st => st.completed))).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </header>

        {/* Milestones */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Development Milestones</h2>
            <button 
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              {showMilestoneForm ? "Cancel" : "+ Add Milestone"}
            </button>
          </div>

          {showMilestoneForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Milestone</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. User Management System"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this milestone..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addMilestone}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create Milestone
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {milestones.map((milestone) => (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                      {milestone.description && (
                        <p className="text-gray-600 mt-2">{milestone.description}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold mr-2 text-blue-600">{milestone.progress}%</span>
                      <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {milestone.tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No tasks added yet</p>
                      <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
                        + Add First Task
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {milestone.tasks.map((task) => (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-5">
                          <div className="flex justify-between items-center cursor-pointer" 
                               onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-700 font-bold">{task.progress}%</span>
                              </div>
                              <h4 className="font-bold text-gray-800">{task.title}</h4>
                            </div>
                            <div>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-5 w-5 text-gray-500 transform transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {expandedTask === task.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pl-11"
                            >
                              <div className="mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center">
                                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-blue-600">{task.progress}%</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {task.subtasks.filter(st => st.completed).length} of {task.subtasks.length} subtasks completed
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {task.subtasks.map((subtask) => (
                                  <div 
                                    key={subtask.id} 
                                    className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow transition-shadow"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subtask.completed}
                                      onChange={() => toggleSubtask(milestone.id, task.id, subtask.id)}
                                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`ml-3 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-4 flex">
                                <input
                                  type="text"
                                  value={newSubtask}
                                  onChange={(e) => setNewSubtask(e.target.value)}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Add new subtask..."
                                  onKeyPress={(e) => e.key === 'Enter' && addSubtask(milestone.id, task.id)}
                                />
                                <button
                                  onClick={() => addSubtask(milestone.id, task.id)}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity"
                                >
                                  Add
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Development Progress</h2>
          
          <div className="space-y-8">
            {milestones.map(milestone => (
              <div key={milestone.id}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">{milestone.title}</h3>
                  <span className="text-blue-600 font-medium">{milestone.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestone.tasks.map(task => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-800">{task.title}</h4>
                        <span className="text-sm font-medium text-blue-600">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Ship Intera?</h2>
          <p className="max-w-2xl mx-auto mb-6 text-blue-100">
            Track your progress, complete all milestones, and deliver the revolutionary inventory management system
          </p>
          <button className="bg-white text-blue-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            Generate Release Report
          </button>
        </div>
      </div>
    </div>
  );
}