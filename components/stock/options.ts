interface PackagingOption {
    value: string;
    label: string;
    description?: string;
  }
  
 export const PACKAGING_OPTIONS: PackagingOption[] = [
    // Electronics Components
    { 
      value: 'tape_reel', 
      label: 'Tape & Reel', 
      description: 'Components on continuous tape wound on reel' 
    },
    { 
      value: 'cut_tape', 
      label: 'Cut Tape', 
      description: 'Segmented tape for manual placement' 
    },
    { 
      value: 'tube', 
      label: 'Tube', 
      description: 'Plastic tube for component storage' 
    },
    { 
      value: 'tray', 
      label: 'Tray', 
      description: 'Anti-static tray for ICs/components' 
    },
  
    // General Packaging
    { 
      value: 'loose', 
      label: 'Loose', 
      description: 'Individual items without packaging' 
    },
    { 
      value: 'bulk', 
      label: 'Bulk', 
      description: 'Large quantity without individual packaging' 
    },
    { 
      value: 'bag', 
      label: 'Bag', 
      description: 'Plastic/resealable bag packaging' 
    },
    { 
      value: 'box', 
      label: 'Boxed', 
      description: 'Cardboard box packaging' 
    },
  
    // Industrial Packaging
    { 
      value: 'pallet', 
      label: 'Palletized', 
      description: 'Stacked on standard shipping pallet' 
    },
    { 
      value: 'crate', 
      label: 'Crated', 
      description: 'Wooden/metal protective enclosure' 
    },
    { 
      value: 'drum', 
      label: 'Drum', 
      description: 'Standard 55-gallon metal/plastic drum' 
    },
  
    // Specialized Formats
    { 
      value: 'esd_bag', 
      label: 'ESD Bag', 
      description: 'Anti-static protective packaging' 
    },
    { 
      value: 'vacuum_sealed', 
      label: 'Vacuum Sealed', 
      description: 'Air-removed sealed packaging' 
    },
    { 
      value: 'clamshell', 
      label: 'Clamshell', 
      description: 'Hinged plastic packaging' 
    },
    { 
      value: 'spool', 
      label: 'Spool', 
      description: 'Wire/cable on cylindrical holder' 
    },
  
    // Liquid/Granular
    { 
      value: 'bottle', 
      label: 'Bottled', 
      description: 'Glass/plastic bottle container' 
    },
    { 
      value: 'jerrican', 
      label: 'Jerrican', 
      description: 'Intermediate bulk container (5-20L)' 
    },
    { 
      value: 'tank', 
      label: 'Tanked', 
      description: 'Large liquid storage tank' 
    },
  
    // Hazardous Materials
    { 
      value: 'un_certified', 
      label: 'UN Certified', 
      description: 'Certified dangerous goods packaging' 
    },
    { 
      value: 'absorbent_pack', 
      label: 'Absorbent Pack', 
      description: 'Leak-absorbing packaging' 
    }
  ];
  