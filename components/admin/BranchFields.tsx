export default function BranchFields({
  branch,
}: {
  branch?: {
    id: string;
    name: string;
    city: string;
    address: string | null;
    active: boolean;
  };
}) {
  return (
    <>
      {branch && <input type="hidden" name="id" value={branch.id} />}
      <div className="av-form-row">
        <label className="av-field">
          Branch name
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={branch?.name}
          />
        </label>
        <label className="av-field">
          City
          <input
            name="city"
            required
            maxLength={100}
            defaultValue={branch?.city}
          />
        </label>
      </div>
      <label className="av-field">
        Collection address
        <input
          name="address"
          maxLength={300}
          defaultValue={branch?.address || ""}
        />
      </label>
      <label className="av-muted flex gap-3">
        <input
          name="active"
          type="checkbox"
          defaultChecked={branch?.active ?? true}
        />
        Accept new bookings
      </label>
    </>
  );
}
