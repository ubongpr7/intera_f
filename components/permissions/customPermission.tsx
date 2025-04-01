import React, { useEffect, useState } from 'react';
import { useGetGroupPermissionQuery, useUpdateGroupPermissionMutation } from '../../redux/features/permission/permit';
import LoadingAnimation from '../common/LoadingAnimation';

interface Permission {
  codename: string;
  name: string;
  description: string;
  category: string;
  has_permission: boolean;
}

interface GroupPermissionFormProps {
  isLoading: boolean;
  permissionsData: any;
  permissionLoading: boolean;
  onSubmit: (data: { permissions: string[] }) => Promise<void>;

}


const CustumPermissionForm: React.FC<GroupPermissionFormProps> = ({  
  isLoading,
  permissionsData,
  permissionLoading,
  onSubmit,
}) => {

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (permissionsData) {
      setPermissions(permissionsData.permissions);
      const initialPermissions: Set<string> = new Set(
        permissionsData.permissions
          .filter((permission: Permission) => permission.has_permission)
          .map((permission: Permission) => permission.codename)
      );
      setSelectedPermissions(initialPermissions);
    }
  }, [permissionsData]);

  const handleCategoryChange = (category: string) => {
    const categoryPermissions = permissions.filter(permission => permission.category === category);
    const newSelectedPermissions = new Set(selectedPermissions);

    const hasAllPermissions = categoryPermissions.every(p => newSelectedPermissions.has(p.codename));

    categoryPermissions.forEach(p => {
      hasAllPermissions 
        ? newSelectedPermissions.delete(p.codename)
        : newSelectedPermissions.add(p.codename);
    });

    setSelectedPermissions(newSelectedPermissions);
  };

  const handlePermissionChange = (codename: string) => {
    const newSelectedPermissions = new Set(selectedPermissions);
    newSelectedPermissions.has(codename)
      ? newSelectedPermissions.delete(codename)
      : newSelectedPermissions.add(codename);
    setSelectedPermissions(newSelectedPermissions);
  };

  const handleSubmit = async () => {
    const permissionsArray = Array.from(selectedPermissions);
    await onSubmit({ permissions: permissionsArray });
  };

  const categories = Array.from(new Set((permissions || []).map(p => p.category)));

  if (isLoading) return (
    <div className="flex justify-center items-center "> 
      <LoadingAnimation  />
    </div>
  );
  

  return (
    <div className="">
      <div className="">
        <div className="flex-1 overflow-y-auto">
          {categories.map(category => (
            <div key={category} className="mb-4">
              <h3 className="font-medium text-md mb-2">
                <input
                  type="checkbox"
                  checked={permissions
                    .filter(p => p.category === category)
                    .every(p => selectedPermissions.has(p.codename))}
                  onChange={() => handleCategoryChange(category)}
                  className="mr-2"
                />
                {category}
              </h3>
              {permissions.filter(p => p.category === category).map(permission => (
                <div key={permission.codename} className="flex items-center pl-5 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(permission.codename)}
                    onChange={() => handlePermissionChange(permission.codename)}
                    className="mr-2"
                  />
                  <label className="text-sm">{permission.codename}</label>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 p-2">
          <div className="flex justify-end gap-3">
          
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              disabled={permissionLoading}
            >
              {permissionLoading ? (
                <LoadingAnimation text="Updating..." ringColor="#3b82f6" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustumPermissionForm;