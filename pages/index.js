import TaskManagementBoard from '../components/TaskManagementBoard'
import DailyTodo from '../components/DailyTodo'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          TaskManagementBoard
        </h1>
        
        {/* 本日のToDo */}
        <div className="mb-8">
          <DailyTodo />
        </div>

        {/* プロジェクト管理 */}
        <TaskManagementBoard />
      </div>
    </div>
  )
}
