% Yarn Constraints https://yarnpkg.com/features/constraints
% check with "yarn constraints" (fix w/ "yarn constraints --fix")
% reference for other constraints: https://github.com/babel/babel/blob/main/constraints.pro

% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').

% Prevent two workspaces from depending on conflicting versions of a same dependency
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  DependencyRange \= DependencyRange2.

% Prevents a dependency from having a caret in its version
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, TargetDependencyRange, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, CurrentDependencyRange, DependencyType),
  atom_concat('^', TargetDependencyRange, CurrentDependencyRange).
